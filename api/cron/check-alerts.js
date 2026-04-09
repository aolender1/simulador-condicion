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

    // Auto-delete events that have ended — runs always, regardless of pending alerts
    const deleted = await sql`DELETE FROM events WHERE end_date < ${now.toISOString()} RETURNING id, title`
    if (deleted.length > 0) {
      console.log('[v0] Eventos eliminados automáticamente:', deleted.map(e => e.title))
    }

    // Fetch all pending events — an event is pending if at least one channel hasn't been sent yet.
    // IMPORTANT: must also include 'email_sent' and 'whatsapp_sent' statuses, because when the email
    // fires first (e.g. 12h before), the status becomes 'email_sent'. If we only query 'pending',
    // the WhatsApp alert (e.g. 2h before) will never be evaluated.
    const allPending = await sql`
      SELECT * FROM events 
      WHERE alert_status IN ('pending', 'email_sent', 'whatsapp_sent')
      AND start_date > ${now.toISOString()}
      AND (email_alert_sent = false OR whatsapp_alert_sent = false)
    `

    if (allPending.length === 0) {
      console.log('[v0] No hay eventos pendientes en la DB')
      return res.json({ message: 'No hay eventos próximos', sent: 0 })
    }

    console.log('[v0] Eventos pendientes encontrados:', allPending.map(e => ({
      id: e.id, title: e.title, start_date: e.start_date,
      hoursUntil: ((new Date(e.start_date) - now) / 3600000).toFixed(2),
      alert_email: e.alert_email, alert_whatsapp: e.alert_whatsapp,
      alert_hours_email: e.alert_hours_email, alert_hours_whatsapp: e.alert_hours_whatsapp,
      email_alert_sent: e.email_alert_sent, whatsapp_alert_sent: e.whatsapp_alert_sent,
      alert_status: e.alert_status
    })))

    // Helper to safely parse alert_hours fields (can come as array or JSON string from DB)
    const parseHours = (val, defaultVal) => {
      if (Array.isArray(val) && val.length > 0) return val.map(Number)
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(Number)
        } catch {}
      }
      if (typeof val === 'number') return [val]
      return defaultVal
    }

    // WINDOW_TOLERANCE_HOURS: with cron every 30min, 0.75h (45min) window guarantees
    // at least one execution lands inside any alert window, with safe margin against
    // double-firing even if two alert hours are 1h apart.
    const WINDOW_TOLERANCE_HOURS = 0.75
    
    const events = allPending.filter(event => {
      const hoursEmail = parseHours(event.alert_hours_email, [24])
      const hoursWhatsapp = parseHours(event.alert_hours_whatsapp, [2])
      const msUntil = new Date(event.start_date) - now
      const hoursUntilEvent = msUntil / (1000 * 60 * 60)
      
      // RETRY LOGIC: If alert time has passed but it wasn't sent yet (due to 500 error or any failure),
      // keep trying until it finally sends or the event starts. This provides resilience against
      // temporary failures (DB, API, network issues).
      
      const emailConfigured = event.alert_email === true || event.alert_email === 'true'
      const waConfigured = event.alert_whatsapp === true || event.alert_whatsapp === 'true'
      
      // Email should fire if:
      // 1. Not sent yet AND configured AND within normal window, OR
      // 2. Not sent yet AND configured AND we're past the alert hour (retry mode)
      const maxEmailHour = Math.max(...hoursEmail)
      const emailInWindow = hoursEmail.some(h => hoursUntilEvent <= h && hoursUntilEvent > (h - WINDOW_TOLERANCE_HOURS))
      const emailPastDue = hoursUntilEvent < maxEmailHour // We're past the alert time, keep retrying
      const emailActive = !event.email_alert_sent && emailConfigured && (emailInWindow || emailPastDue)
      
      // WhatsApp should fire if:
      // 1. Not sent yet AND configured AND within normal window, OR
      // 2. Not sent yet AND configured AND we're past the alert hour (retry mode)
      const maxWaHour = Math.max(...hoursWhatsapp)
      const waInWindow = hoursWhatsapp.some(h => hoursUntilEvent <= h && hoursUntilEvent > (h - WINDOW_TOLERANCE_HOURS))
      const waPastDue = hoursUntilEvent < maxWaHour // We're past the alert time, keep retrying
      const waActive = !event.whatsapp_alert_sent && waConfigured && (waInWindow || waPastDue)
      
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
      const hoursEmail = parseHours(event.alert_hours_email, [24])
      const hoursWhatsapp = parseHours(event.alert_hours_whatsapp, [2])
      
      // Same retry logic: send if in window OR if past due (retry mode)
      const maxEmailHour = Math.max(...hoursEmail)
      const maxWaHour = Math.max(...hoursWhatsapp)
      const emailInWindow = hoursEmail.some(h => hoursUntilExact <= h && hoursUntilExact > (h - WINDOW_TOLERANCE_HOURS))
      const emailPastDue = hoursUntilExact < maxEmailHour
      const waInWindow = hoursWhatsapp.some(h => hoursUntilExact <= h && hoursUntilExact > (h - WINDOW_TOLERANCE_HOURS))
      const waPastDue = hoursUntilExact < maxWaHour
      
      const shouldSendEmail = sendEmail && !event.email_alert_sent && (emailInWindow || emailPastDue)
      const shouldSendWa = sendWhatsApp && !event.whatsapp_alert_sent && (waInWindow || waPastDue)
      
      // Log retry mode for debugging
      if (shouldSendEmail && emailPastDue && !emailInWindow) {
        console.log(`[v0] RETRY MODE - Email para "${event.title}" (faltan ${hoursUntilExact.toFixed(2)}h, debió enviarse hace ${(maxEmailHour - hoursUntilExact).toFixed(2)}h)`)
      }
      if (shouldSendWa && waPastDue && !waInWindow) {
        console.log(`[v0] RETRY MODE - WhatsApp para "${event.title}" (faltan ${hoursUntilExact.toFixed(2)}h, debió enviarse hace ${(maxWaHour - hoursUntilExact).toFixed(2)}h)`)
      }

      // --- Email ---
      if (shouldSendEmail && emails.length > 0) {
        const emailSubject = `[RECORDATORIO ${hoursUntil}h] ${event.materia}: ${event.title}`
        const emailHtml = `
          <h2>Recordatorio de Evento</h2>
          <p><strong>Faltan aproximadamente ${hoursUntil} horas</strong></p>
          <p><strong>Materia:</strong> ${event.materia}</p>
          <p><strong>Evento:</strong> ${event.title}</p>
          ${event.event_link ? `<p><strong>Link del Evento:</strong> <a href="${event.event_link}" target="_blank">${event.event_link}</a></p>` : ''}
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
            results.push({ eventId: event.id, type: 'email', to: email, status: 'sent' })
          } catch (err) {
            console.error(`[v0] ERROR enviando email a ${email} para evento "${event.title}":`, err.message)
            results.push({ eventId: event.id, type: 'email', to: email, status: 'error', error: err.message })
          }
        }
      }

      // --- WhatsApp ---
      if (shouldSendWa && phoneContacts.length > 0) {
        for (const contact of phoneContacts) {
          try {
            await sendWhatsAppMessage(contact.phone, whatsappTemplateName, [
              event.title,
              event.materia,
              startDateOnly,
              startTimeOnly
            ])
            results.push({ eventId: event.id, type: 'whatsapp', to: contact.phone, status: 'sent' })
          } catch (err) {
            console.error(`[v0] ERROR enviando WhatsApp a ${contact.phone} para evento "${event.title}":`, err.message)
            results.push({ eventId: event.id, type: 'whatsapp', to: contact.phone, status: 'error', error: err.message })
          }
        }
      }

      // Mark each channel individually, and set alert_status based on what's been sent
      const emailSent = results.some(r => r.eventId === event.id && r.type === 'email' && r.status === 'sent')
      const waSent = results.some(r => r.eventId === event.id && r.type === 'whatsapp' && r.status === 'sent')

      if (emailSent) {
        await sql`UPDATE events SET email_alert_sent = true WHERE id = ${event.id}`
      }
      if (waSent) {
        await sql`UPDATE events SET whatsapp_alert_sent = true WHERE id = ${event.id}`
      }

      // Determine new alert_status based on which channels are configured and sent
      const needsEmail = sendEmail
      const needsWa = sendWhatsApp
      const emailDone = !needsEmail || emailSent || event.email_alert_sent
      const waDone = !needsWa || waSent || event.whatsapp_alert_sent

      let newStatus = event.alert_status
      if (emailDone && waDone) {
        newStatus = 'sent'
      } else if ((emailSent || event.email_alert_sent) && needsEmail && !waDone) {
        newStatus = 'email_sent'
      } else if ((waSent || event.whatsapp_alert_sent) && needsWa && !emailDone) {
        newStatus = 'whatsapp_sent'
      }

      if (newStatus !== event.alert_status) {
        await sql`UPDATE events SET alert_status = ${newStatus} WHERE id = ${event.id}`
        console.log('[v0] Estado actualizado:', event.title, '->', newStatus)
      }
      sentCount++
    }

    res.json({ message: 'Alertas procesadas', sent: sentCount, results, deleted: deleted.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al procesar alertas' })
  }
}
