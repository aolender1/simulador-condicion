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

  // Verify secret - accepts header OR query param for cron-job.org compatibility
  const secret = process.env.CRON_SECRET
  if (secret) {
    const incoming = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '') || req.query.secret
    if (incoming !== secret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const sql = neon(process.env.DATABASE_URL)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const whatsappTemplateName = process.env.WHATSAPP_TEMPLATE_NAME || 'alerta_evento'

  try {
    const now = new Date()
    console.log('[v0] Cron ejecutado:', now.toISOString(), '| Hora AR:', now.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }))

    // Fetch all pending events
    const allPending = await sql`
      SELECT * FROM events 
      WHERE alert_status = 'pending' 
      AND start_date > ${now.toISOString()}
    `

    if (allPending.length === 0) {
      console.log('[v0] No hay eventos pendientes en la DB')
      return res.json({ message: 'No hay eventos próximos', sent: 0 })
    }

    console.log('[v0] Eventos pendientes encontrados:', allPending.map(e => ({
      id: e.id, title: e.title, start_date: e.start_date,
      hoursUntil: ((new Date(e.start_date) - now) / 3600000).toFixed(2),
      alert_email: e.alert_email, alert_whatsapp: e.alert_whatsapp,
      alert_hours_email: e.alert_hours_email, alert_hours_whatsapp: e.alert_hours_whatsapp
    })))

    // Filter events where email OR whatsapp window is active
    // Use a 90-minute window tolerance: alert fires if hoursUntil <= target AND hoursUntil > (target - 1.5)
    const WINDOW_TOLERANCE_HOURS = 2.0
    const events = allPending.filter(event => {
      const hoursEmail = Array.isArray(event.alert_hours_email) && event.alert_hours_email.length > 0
        ? event.alert_hours_email : [24]
      const hoursWhatsapp = Array.isArray(event.alert_hours_whatsapp) && event.alert_hours_whatsapp.length > 0
        ? event.alert_hours_whatsapp : [2]
      const msUntil = new Date(event.start_date) - now
      const hoursUntilEvent = msUntil / (1000 * 60 * 60)
      const emailActive = (event.alert_email === true || event.alert_email === 'true') &&
        hoursEmail.some(h => hoursUntilEvent <= h && hoursUntilEvent > (h - WINDOW_TOLERANCE_HOURS))
      const waActive = (event.alert_whatsapp === true || event.alert_whatsapp === 'true') &&
        hoursWhatsapp.some(h => hoursUntilEvent <= h && hoursUntilEvent > (h - WINDOW_TOLERANCE_HOURS))
      return emailActive || waActive
    })

    if (events.length === 0) {
      console.log('[v0] Ningún evento dentro de la ventana de alerta')
      return res.json({ message: 'No hay eventos dentro de las ventanas de alerta', sent: 0 })
    }
    console.log('[v0] Eventos en ventana:', events.map(e => e.title))

    const contacts = await sql`SELECT email, phone FROM contacts`
    const emails = contacts.map(c => c.email).filter(e => e && e.trim() !== '')
    const phoneContacts = contacts.filter(c => c.phone && c.phone.trim() !== '')
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    let sentCount = 0
    const results = []

    for (const event of events) {
      const eventDate = new Date(event.start_date)
      const tzOpts = { timeZone: 'America/Argentina/Buenos_Aires' }
      const startDate = eventDate.toLocaleString('es-AR', {
        ...tzOpts,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      })
      const startDateOnly = eventDate.toLocaleDateString('es-AR', { ...tzOpts, year: 'numeric', month: '2-digit', day: '2-digit' })
      const startTimeOnly = eventDate.toLocaleTimeString('es-AR', {
        ...tzOpts, hour: '2-digit', minute: '2-digit', hour12: false
      })
      const msUntil = new Date(event.start_date) - now
      const hoursUntilExact = msUntil / (1000 * 60 * 60)
      const hoursUntil = Math.ceil(hoursUntilExact)

      const sendEmail = event.alert_email === true || event.alert_email === 'true'
      const sendWhatsApp = event.alert_whatsapp === true || event.alert_whatsapp === 'true'
      const hoursEmail = Array.isArray(event.alert_hours_email) && event.alert_hours_email.length > 0
        ? event.alert_hours_email : [24]
      const hoursWhatsapp = Array.isArray(event.alert_hours_whatsapp) && event.alert_hours_whatsapp.length > 0
        ? event.alert_hours_whatsapp : [2]
      const emailInWindow = hoursEmail.some(h => hoursUntilExact <= h && hoursUntilExact > (h - WINDOW_TOLERANCE_HOURS))
      const waInWindow = hoursWhatsapp.some(h => hoursUntilExact <= h && hoursUntilExact > (h - WINDOW_TOLERANCE_HOURS))

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
      if (sendWhatsApp && waInWindow && phoneContacts.length > 0) {
        for (const contact of phoneContacts) {
          try {
            await sendWhatsAppMessage(contact.phone, whatsappTemplateName, [
              event.title,
              event.materia,
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
