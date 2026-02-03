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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  const sql = neon(process.env.DATABASE_URL)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { id } = req.query

  try {
    const events = await sql`SELECT * FROM events WHERE id = ${id}`
    if (events.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' })
    }
    const event = events[0]

    const mails = await sql`SELECT email FROM mails`
    if (mails.length === 0) {
      return res.status(400).json({ error: 'No hay emails registrados' })
    }

    const emails = mails.map(m => m.email)
    const startDate = new Date(event.start_date).toLocaleString('es-AR')

    await resend.emails.send({
      from: 'Calendario UNSL <onboarding@resend.dev>',
      to: emails,
      subject: `[ALERTA] ${event.materia}: ${event.title}`,
      html: `
        <h2>Recordatorio de Evento</h2>
        <p><strong>Materia:</strong> ${event.materia}</p>
        <p><strong>Evento:</strong> ${event.title}</p>
        <p><strong>Fecha y hora:</strong> ${startDate}</p>
        <hr>
        <p>Calendario UNSL</p>
      `
    })

    await sql`UPDATE events SET alert_status = 'sent' WHERE id = ${id}`

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al enviar alerta' })
  }
}