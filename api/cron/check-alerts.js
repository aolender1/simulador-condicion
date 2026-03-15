import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

async function sendWhatsAppMessage(phone, templateName, parameters) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp env vars not configured, skipping WhatsApp notification')
    return { skipped: true }
  }

  // Normalize phone: remove spaces/dashes, ensure it starts with country code (no +)
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
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sql = neon(process.env.DATABASE_URL)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const whatsappTemplateName = process.env.WHATSAPP_TEMPLATE_NAME || 'alerta_evento'

  try {
    const now = new Date()

    // Fetch all pending events
    const allPending = await sql`
      SELECT * FROM events 
      WHERE alert_status = 'pending' 
      AND start_date > ${now.toISOString()}
    `

    if (allPending.length === 0) {
      return res.json({ message: 'No hay eventos próximos', sent: 0 })
    }

    // Filter events where email OR whatsapp window is active
    const events = allPending.filter(event => {
      const hoursEmail = Array.isArray(event.alert_hours_email) && event.alert_hours_email.length > 0
        ? event.alert_hours_email : [24]
      const hoursWhatsapp = Array.isArray(event.alert_hours_whatsapp) && event.alert_hours_whatsapp.length > 0
        ? event.alert_hours_whatsapp : [2]
      const msUntil = new Date(event.start_date) - now
      const hoursUntilEvent = msUntil / (1000 * 60 * 60)
      const emailActive = event.alert_email !== false && hoursEmail.some(h => hoursUntilEvent <= h && hoursUntilEvent > 0)
      const waActive = event.alert_whatsapp === true && hoursWhatsapp.some(h => hoursUntilEvent <= h && hoursUntilEvent > 0)
      return emailActive || waActive
    })

    if (events.length === 0) {
      return res.json({ message: 'No hay eventos dentro de las ventanas de alerta', sent: 0 })
    }

    const mails = await sql`SELECT email FROM mails`
    const contacts = await sql`SELECT email, phone FROM contacts WHERE phone IS NOT NULL AND phone <> ''`

    if (mails.length === 0 && contacts.length === 0) {
      return res.json({ message: 'No hay destinatarios registrados', sent: 0 })
    }

    const emails = mails.map(m => m.email)
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    let sentCount = 0
    const results = []

    for (const event of events) {
      const eventDate = new Date(event.start_date)
      const startDate = eventDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
      const startDateOnly = eventDate.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
      const startTimeOnly = eventDate.toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit'
      })
      const hoursUntil = Math.round((eventDate - now) / (1000 * 60 * 60))

      const sendEmail = event.alert_email !== false
      const sendWhatsApp = event.alert_whatsapp === true
      const hoursEmail = Array.isArray(event.alert_hours_email) && event.alert_hours_email.length > 0
        ? event.alert_hours_email : [24]
      const hoursWhatsapp = Array.isArray(event.alert_hours_whatsapp) && event.alert_hours_whatsapp.length > 0
        ? event.alert_hours_whatsapp : [2]
      const emailInWindow = hoursEmail.some(h => hoursUntil <= h && hoursUntil > 0)
      const waInWindow = hoursWhatsapp.some(h => hoursUntil <= h && hoursUntil > 0)

      // --- Email ---
      if (sendEmail && emailInWindow && emails.length > 0) {
        const emailSubject = `[RECORDATORIO ${hoursUntil}h] ${event.materia}: ${event.title}`
        const emailHtml = `
          <h2>Recordatorio de Evento</h2>
          <p><strong>Faltan aproximadamente ${hoursUntil} horas</strong></p>
          <p><strong>Materia:</strong> ${event.materia}</p>
          <p><strong>Evento:</strong> ${event.title}</p>
          <p><strong>Fecha y hora:</strong> ${startDate}</p>
          <hr>
          <p>Calendario UNSL</p>
        `
        for (const email of emails) {
          try {
            await resend.emails.send({
              from: `Calendario UNSL <${fromAddress}>`,
              to: email,
              subject: emailSubject,
              html: emailHtml
            })
            results.push({ type: 'email', to: email, status: 'sent' })
          } catch (err) {
            results.push({ type: 'email', to: email, status: 'error', error: err.message })
          }
        }
      }

      // --- WhatsApp ---
      if (sendWhatsApp && waInWindow && contacts.length > 0) {
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

      await sql`UPDATE events SET alert_status = 'sent' WHERE id = ${event.id}`
      sentCount++
    }

    res.json({ message: 'Alertas procesadas', sent: sentCount, results })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al procesar alertas' })
  }
}
