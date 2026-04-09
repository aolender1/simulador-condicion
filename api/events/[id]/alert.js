import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'

function verifyToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
  } catch {
    return null
  }
}

async function sendWhatsAppMessage(phone, templateName, parameters) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    return { skipped: true }
  }

  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')

  const body = {
    messaging_product: 'whatsapp',
    to: normalizedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es_AR' },
      components: [
        {
          type: 'body',
          parameters: parameters.map(value => ({ type: 'text', text: String(value) }))
        }
      ]
    }
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`)
  }
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  const sql = neon(process.env.DATABASE_URL)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { id } = req.query

  const whatsappTemplateName = process.env.WHATSAPP_TEMPLATE_NAME || 'alerta_evento'

  try {
    const events = await sql`SELECT * FROM events WHERE id = ${id}`
    if (events.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' })
    }
    const event = events[0]

    const eventDate = new Date(event.start_date)
    const startDate = eventDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    const startDateOnly = eventDate.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    const startTimeOnly = eventDate.toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit'
    })

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const results = []

    // Determinar canales a usar (respetar config del evento, con fallback a email=true)
    const sendEmail = event.alert_email !== false
    const sendWhatsApp = event.alert_whatsapp === true

    // --- Email ---
    if (sendEmail) {
      const mails = await sql`SELECT email FROM mails`
      if (mails.length === 0) {
        if (!sendWhatsApp) {
          return res.status(400).json({ error: 'No hay destinatarios registrados' })
        }
      } else {
        const emailSubject = `[ALERTA] ${event.materia}: ${event.title}`
        const emailHtml = `
          <h2>Recordatorio de Evento</h2>
          <p><strong>Materia:</strong> ${event.materia}</p>
          <p><strong>Evento:</strong> ${event.title}</p>
          ${event.event_link ? `<p><strong>Link del Evento:</strong> <a href="${event.event_link}" target="_blank">${event.event_link}</a></p>` : ''}
          <p><strong>Fecha y hora:</strong> ${startDate}</p>
          <hr>
          <p>Calendario UNSL</p>
        `
        for (const mail of mails) {
          try {
            await resend.emails.send({
              from: `Calendario UNSL <${fromAddress}>`,
              to: mail.email,
              subject: emailSubject,
              html: emailHtml
            })
            results.push({ type: 'email', to: mail.email, status: 'sent' })
          } catch (err) {
            results.push({ type: 'email', to: mail.email, status: 'error', error: err.message })
          }
        }
      }
    }

    // --- WhatsApp ---
    if (sendWhatsApp) {
      const contacts = await sql`SELECT phone FROM contacts WHERE phone IS NOT NULL AND phone <> ''`
      for (const contact of contacts) {
        try {
          await sendWhatsAppMessage(contact.phone, whatsappTemplateName, [
            event.title,
            startDateOnly,
            startTimeOnly
          ])
          results.push({ type: 'whatsapp', to: contact.phone, status: 'sent' })
        } catch (err) {
          results.push({ type: 'whatsapp', to: contact.phone, status: 'error', error: err.message })
        }
      }
    }

    await sql`UPDATE events SET alert_status = 'sent' WHERE id = ${id}`

    res.json({ success: true, results })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al enviar alerta' })
  }
}
