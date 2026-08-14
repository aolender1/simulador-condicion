import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);

// Verificar token de sesión de Better Auth / Neon Auth
// Los tokens de sesión son opacos y se validan directamente contra la tabla
// neon_auth.session (el endpoint HTTP /get-session no acepta Bearer tokens).
// El acceso admin se controla por el rol 'admin' del usuario en la DB.
const verifySession = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token || token === 'undefined') return null;

  try {
    const rows = await sql`
      SELECT u.email, u.role
      FROM neon_auth.session s
      JOIN neon_auth.user u ON u.id = s."userId"
      WHERE s.token = ${token}
        AND s."expiresAt" > NOW()
    `;

    if (!rows.length) return null;

    if (rows[0].role !== 'admin') return null;

    return { email: rows[0].email };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
};

// Middleware para rutas admin
const verifyAdmin = async (req, res, next) => {
  // Intentar verificar con token si está presente
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const user = await verifySession(req);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // En producción se exige una sesión válida. En desarrollo se permite el acceso.
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// Endpoint para verificar si el email está permitido
app.get('/api/check-access', async (req, res) => {
  try {
    const user = await verifySession(req);
    res.json({
      allowed: !!user,
      email: user?.email || null
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.json({ allowed: false });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await sql`SELECT * FROM events ORDER BY start_date ASC`;
    res.json(events);
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


app.post('/api/events', verifyAdmin, async (req, res) => {
  try {
    const { materia, title, start_date, end_date, color, estado_alerta } = req.body;
    const result = await sql`
      INSERT INTO events (materia, title, start_date, end_date, color, estado_alerta)
      VALUES (${materia}, ${title}, ${start_date}, ${end_date}, ${color}, ${estado_alerta || 'pendiente'})
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/events/:id', verifyAdmin, async (req, res) => {
  try {
    const { materia, title, start_date, end_date, color, estado_alerta } = req.body;
    const result = await sql`
      UPDATE events SET 
        materia = ${materia}, title = ${title}, start_date = ${start_date},
        end_date = ${end_date}, color = ${color}, estado_alerta = ${estado_alerta}
      WHERE id = ${req.params.id} RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/events/:id', verifyAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM events WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/events/:id/alert', verifyAdmin, async (req, res) => {
  try {
    const events = await sql`SELECT * FROM events WHERE id = ${req.params.id}`;
    if (events.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    const event = events[0];
    const contacts = await sql`SELECT email FROM contacts WHERE email IS NOT NULL AND email <> '' AND enabled_email = true`;
    if (contacts.length === 0) return res.status(400).json({ error: 'No hay contactos registrados para enviar alertas' });

    const startDate = new Date(event.start_date).toLocaleString('es-AR');

    // Intentar enviar el email
    const emailResult = await resend.emails.send({
      from: `Calendario UNSL <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: contacts.map(c => c.email),
      subject: `[ALERTA] ${event.materia}: ${event.title}`,
      html: `
        <h2>Recordatorio de Evento</h2>
        <p><strong>Materia:</strong> ${event.materia}</p>
        <p><strong>Evento:</strong> ${event.title}</p>
        ${event.event_link ? `<p><strong>Link del Evento:</strong> <a href="${event.event_link}" target="_blank">${event.event_link}</a></p>` : ''}
        <p><strong>Fecha y hora:</strong> ${startDate}</p>
        <hr>
        <p>Calendario UNSL</p>
      `
    });

    console.log('Email enviado:', emailResult);

    await sql`UPDATE events SET estado_alerta = 'enviado' WHERE id = ${req.params.id}`;
    res.json({ success: true, message: `Alerta enviada a ${contacts.length} contacto(s)` });
  } catch (error) {
    console.error('Alert error:', error);

    // Manejar error específico de Resend (dominio de prueba)
    if (error.statusCode === 403 || error.message?.includes('Testing domain')) {
      return res.status(400).json({
        error: 'El dominio de prueba de Resend solo permite enviar a tu propio email. Verifica un dominio propio en Resend para enviar a otros destinatarios.'
      });
    }

    res.status(500).json({ error: error.message || 'Error al enviar alerta' });
  }
});

app.get('/api/contacts', verifyAdmin, async (req, res) => {
  try {
    const contacts = await sql`SELECT * FROM contacts ORDER BY id ASC`;
    res.json(contacts);
  } catch (error) {
    console.error('Contacts error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/contacts', verifyAdmin, async (req, res) => {
  try {
    const { email, phone } = req.body;
    const result = await sql`INSERT INTO contacts (email, phone) VALUES (${email}, ${phone}) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/contacts/:id', verifyAdmin, async (req, res) => {
  try {
    const { email, phone, enabled_email, enabled_whatsapp } = req.body;
    const nextEmail = enabled_email !== undefined ? enabled_email : null;
    const nextWhatsapp = enabled_whatsapp !== undefined ? enabled_whatsapp : null;
    const result = await sql`
      UPDATE contacts SET
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        enabled_email = COALESCE(${nextEmail}, enabled_email),
        enabled_whatsapp = COALESCE(${nextWhatsapp}, enabled_whatsapp)
      WHERE id = ${req.params.id} RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/contacts/set-all', verifyAdmin, async (req, res) => {
  try {
    const { enabled_email, enabled_whatsapp } = req.body;
    const nextEmail = enabled_email !== undefined ? enabled_email : null;
    const nextWhatsapp = enabled_whatsapp !== undefined ? enabled_whatsapp : null;
    const result = await sql`
      UPDATE contacts SET
        enabled_email = COALESCE(${nextEmail}, enabled_email),
        enabled_whatsapp = COALESCE(${nextWhatsapp}, enabled_whatsapp)
      RETURNING *
    `;
    res.json(result);
  } catch (error) {
    console.error('Set all contacts error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/contacts/:id', verifyAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM contacts WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

// Para Vercel (serverless)
export default app;
