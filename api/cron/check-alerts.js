import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sql = neon(process.env.DATABASE_URL)
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const now = new Date()
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const events = await sql`
      SELECT * FROM events 
      WHERE alert_status = 'pending' 
      AND (
        (start_date BETWEEN ${now.toISOString()} AND ${in2Hours.toISOString()})
        OR (start_date BETWEEN ${now.toISOString()} AND ${in24Hours.toISOString()})
      )
    `

    if (events.length === 0) {
      return res.json({ message: 'No hay eventos próximos', sent: 0 })
    }

    const mails = await sql`SELECT email FROM mails`
    if (mails.length === 0) {
      return res.json({ message: 'No hay emails registrados', sent: 0 })
    }

    const emails = mails.map(m => m.email)
    let sentCount = 0

    for (const event of events) {
      const startDate = new Date(event.start_date).toLocaleString('es-AR')
      const hoursUntil = Math.round((new Date(event.start_date) - now) / (1000 * 60 * 60))

      await resend.emails.send({
        from: 'Calendario UNSL <onboarding@resend.dev>',
        to: emails,
        subject: `[RECORDATORIO ${hoursUntil}h] ${event.materia}: ${event.title}`,
        html: `
          <h2>Recordatorio de Evento</h2>
          <p><strong>Faltan aproximadamente ${hoursUntil} horas</strong></p>
          <p><strong>Materia:</strong> ${event.materia}</p>
          <p><strong>Evento:</strong> ${event.title}</p>
          <p><strong>Fecha y hora:</strong> ${startDate}</p>
          <hr>
          <p>Calendario UNSL</p>
        `
      })

      await sql`UPDATE events SET alert_status = 'sent' WHERE id = ${event.id}`
      sentCount++
    }

    res.json({ message: 'Alertas enviadas', sent: sentCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al procesar alertas' })
  }
}