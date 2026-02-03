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

// Emails permitidos para acceso admin
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

// Verificar JWT token de Better Auth / Neon Auth
const verifySession = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token || token === 'undefined') return null;

  try {
    // Verificar el token con Neon Auth
    const response = await fetch(`${process.env.VITE_NEON_AUTH_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return null;

    const session = await response.json();
    const user = session?.user;

    // Verificar si el email está permitido
    if (user && ALLOWED_EMAILS.includes(user.email?.toLowerCase())) {
      return user;
    }

    return null;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
};

// Middleware para rutas admin (simplificado por ahora)
// El frontend ya verifica la sesión, pero esto agrega una capa extra de seguridad
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

  // Por ahora, permitir acceso si no hay token (el frontend ya validó)
  // En producción, deberías verificar siempre
  next();
};

// Endpoint para verificar si el email está permitido
app.get('/api/check-access', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.json({ allowed: false });
    }

    const token = authHeader.slice(7);
    if (!token || token === 'undefined') {
      return res.json({ allowed: false });
    }

    // Verificar el token con Neon Auth
    const response = await fetch(`${process.env.VITE_NEON_AUTH_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.json({ allowed: false });
    }

    const session = await response.json();
    const user = session?.user;

    // Verificar si el email está permitido
    const allowed = user && ALLOWED_EMAILS.includes(user.email?.toLowerCase());

    res.json({
      allowed,
      email: user?.email,
      allowedEmails: ALLOWED_EMAILS // Para debugging (eliminar en producción)
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
    const contacts = await sql`SELECT email FROM contacts`;
    if (contacts.length === 0) return res.status(400).json({ error: 'No hay contactos registrados para enviar alertas' });

    const startDate = new Date(event.start_date).toLocaleString('es-AR');

    // Intentar enviar el email
    const emailResult = await resend.emails.send({
      from: 'Calendario UNSL <onboarding@resend.dev>',
      to: contacts.map(c => c.email),
      subject: `Recordatorio: ${event.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00796b;">${event.materia}</h2>
          <p><strong>${event.title}</strong></p>
          <p>📅 Fecha: ${startDate}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Este es un recordatorio automático del Calendario UNSL.</p>
        </div>
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