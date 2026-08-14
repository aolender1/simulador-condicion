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

  // En producción se exige una sesión válida. En desarrollo se permite el acceso
  // (para el login de desarrollo sin sesión real).
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// Endpoint para verificar si el email está permitido
app.get('/api/check-access', async (req, res) => {
  try {
    // DIAGNÓSTICO TEMPORAL - se elimina al resolver el acceso
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    let diag = {
      headerReceived: !!authHeader,
      tokenLen: token?.length ?? 0
    };
    if (token) {
      const parts = token.split('.');
      diag.jwt = parts.length === 3;
      let payload = null;
      try {
        payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      } catch (e) {
        diag.decodeError = String(e.message).slice(0, 120);
      }
      if (payload && typeof payload === 'object') {
        diag.payloadKeys = Object.keys(payload);
        const preview = {};
        for (const k of Object.keys(payload)) {
          const v = payload[k];
          preview[k] = typeof v === 'string' ? `${v.slice(0, 16)}…(${v.length})` : Array.isArray(v) ? `array(${v.length})` : String(typeof v) + (typeof v === 'number' ? ':' + v : '');
        }
        diag.payload = preview;
        for (const f of ['sub', 'sessionId', 'sessionToken', 'session_token', 'token', 'jti', 'uid']) {
          const v = payload[f];
          if (typeof v === 'string' && v.length > 10) {
            try {
              const r = await sql`SELECT u.email, u.role, s."expiresAt" FROM neon_auth.session s JOIN neon_auth.user u ON u.id = s."userId" WHERE s.token = ${v}`;
              diag[`cand_${f}`] = { len: v.length, found: r.length > 0, email: r[0]?.email ?? null, role: r[0]?.role ?? null, expiresAt: r[0]?.expiresAt ?? null };
            } catch (e) {
              diag[`cand_${f}`] = { err: String(e.message).split('\n')[0].slice(0, 80) };
            }
          }
        }
      }
      try {
        const rows = await sql`
          SELECT u.email, u.role, s."expiresAt"
          FROM neon_auth.session s
          JOIN neon_auth.user u ON u.id = s."userId"
          WHERE s.token = ${token}
        `;
        diag.directMatch = { found: rows.length > 0, email: rows[0]?.email ?? null, role: rows[0]?.role ?? null };
      } catch (e) {
        diag.dbError = String(e.message).split('\n')[0].slice(0, 150);
      }
    }
    const user = await verifySession(req);
    res.json({ allowed: !!user, email: user?.email || null, diag });
  } catch (error) {
    console.error('Check access error:', error);
    res.json({ allowed: false, diag: { error: String(error.message).slice(0, 200) } });
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
    const { materia, title, event_link, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp } = req.body;
    const hoursEmail = Array.isArray(alert_hours_email) ? alert_hours_email : (alert_hours_email ? JSON.parse(alert_hours_email) : [24]);
    const hoursWa = Array.isArray(alert_hours_whatsapp) ? alert_hours_whatsapp : (alert_hours_whatsapp ? JSON.parse(alert_hours_whatsapp) : [2]);
    const result = await sql`
      INSERT INTO events (materia, title, event_link, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp)
      VALUES (
        ${materia}, ${title}, ${event_link || null}, ${start_date}, ${end_date}, ${color},
        ${alert_status || 'pending'},
        ${alert_email !== undefined ? alert_email : true},
        ${alert_whatsapp !== undefined ? alert_whatsapp : false},
        ${`{${hoursEmail.join(',')}}`},
        ${`{${hoursWa.join(',')}}`}
      )
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
    const { materia, title, event_link, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp } = req.body;
    const hoursEmail = Array.isArray(alert_hours_email) ? alert_hours_email : (alert_hours_email ? JSON.parse(alert_hours_email) : [24]);
    const hoursWa = Array.isArray(alert_hours_whatsapp) ? alert_hours_whatsapp : (alert_hours_whatsapp ? JSON.parse(alert_hours_whatsapp) : [2]);
    const result = await sql`
      UPDATE events SET
        materia = ${materia}, title = ${title}, event_link = ${event_link || null}, start_date = ${start_date},
        end_date = ${end_date}, color = ${color},
        alert_status = ${alert_status || 'pending'},
        alert_email = ${alert_email !== undefined ? alert_email : true},
        alert_whatsapp = ${alert_whatsapp !== undefined ? alert_whatsapp : false},
        alert_hours_email = ${`{${hoursEmail.join(',')}}`},
        alert_hours_whatsapp = ${`{${hoursWa.join(',')}}`},
        email_alert_sent = false,
        whatsapp_alert_sent = false
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

    const eventDate = new Date(event.start_date);
    const tzOpts = { timeZone: 'America/Argentina/Buenos_Aires' };
    const startDate = eventDate.toLocaleString('es-AR', {
      ...tzOpts,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const startDateOnly = eventDate.toLocaleDateString('es-AR', { ...tzOpts, year: 'numeric', month: '2-digit', day: '2-digit' });
    const startTimeOnly = eventDate.toLocaleTimeString('es-AR', {
      ...tzOpts,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const fromAddress = `Calendario UNSL <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
    const results = [];

    const sendEmail = event.alert_email === true || event.alert_email === 'true';
    const sendWhatsApp = event.alert_whatsapp === true || event.alert_whatsapp === 'true';
    const whatsappTemplateName = process.env.WHATSAPP_TEMPLATE_NAME || 'alerta_evento';

    // --- Email ---
    if (sendEmail) {
      const contacts = await sql`SELECT email FROM contacts WHERE email IS NOT NULL AND email <> '' AND enabled_email = true`;
      if (contacts.length === 0 && !sendWhatsApp) {
        return res.status(400).json({ error: 'No hay contactos registrados para enviar alertas' });
      }
      const emailSubject = `[ALERTA] ${event.materia}: ${event.title}`;
      const emailHtml = `
        <h2>Recordatorio de Evento</h2>
        <p><strong>Materia:</strong> ${event.materia}</p>
        <p><strong>Evento:</strong> ${event.title}</p>
        ${event.event_link ? `<p><strong>Link del Evento:</strong> <a href="${event.event_link}" target="_blank">${event.event_link}</a></p>` : ''}
        <p><strong>Fecha y hora:</strong> ${startDate}</p>
        <hr>
        <p>Calendario UNSL</p>
      `;
      for (const contact of contacts) {
        try {
          await resend.emails.send({
            from: fromAddress,
            to: contact.email,
            subject: emailSubject,
            html: emailHtml
          });
          results.push({ type: 'email', to: contact.email, status: 'sent' });
        } catch (err) {
          results.push({ type: 'email', to: contact.email, status: 'error', error: err.message });
        }
      }
    }

    // --- WhatsApp ---
    if (sendWhatsApp) {
      const phoneContacts = await sql`SELECT phone FROM contacts WHERE phone IS NOT NULL AND phone <> '' AND enabled_whatsapp = true`;
      for (const contact of phoneContacts) {
        try {
          const normalizedPhone = contact.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
          const waBody = {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'template',
            template: {
              name: whatsappTemplateName,
              language: { code: 'es_AR' },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: event.title },
                  { type: 'text', text: event.materia },
                  { type: 'text', text: startDateOnly },
                  { type: 'text', text: startTimeOnly }
                ]
              }]
            }
          };
          const waRes = await fetch(
            `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(waBody)
            }
          );
          const waData = await waRes.json();
          if (!waRes.ok) throw new Error(JSON.stringify(waData));
          results.push({ type: 'whatsapp', to: contact.phone, status: 'sent' });
        } catch (err) {
          results.push({ type: 'whatsapp', to: contact.phone, status: 'error', error: err.message });
        }
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    if (sentCount > 0) {
      await sql`UPDATE events SET alert_status = 'sent' WHERE id = ${req.params.id}`;
    }
    res.json({ success: true, message: `Alerta enviada (${sentCount} envío/s exitoso/s)`, results });  } catch (error) {
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

// Actualizar un contacto (email, teléfono, activar/desactivar envío)
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

// Activar/desactivar un canal para todos los contactos
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
