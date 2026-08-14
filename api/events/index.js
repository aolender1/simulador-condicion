import { neon } from '@neondatabase/serverless'

async function verifySession(req, sql) {
  try {
    const cookieHeader = req.headers.cookie || ''
    const match = cookieHeader.match(/(?:^|;\s*)better-auth\.session_token=([^;]+)/)
    if (!match) return null
    const token = decodeURIComponent(match[1])

    const rows = await sql`
      SELECT u.email, u.role FROM neon_auth.session s
      JOIN neon_auth.user u ON u.id = s."userId"
      WHERE s.token = ${token}
        AND s."expiresAt" > NOW()
    `
    if (!rows.length) return null
    if (rows[0].role !== 'admin') return null
    return { email: rows[0].email }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL)

  if (req.method === 'GET') {
    try {
      const events = await sql`SELECT * FROM events ORDER BY start_date ASC`
      return res.json(events)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al obtener eventos' })
    }
  }

  if (req.method === 'POST') {
    const user = await verifySession(req, sql)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { materia, title, event_link, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp } = req.body

    try {
      const result = await sql`
        INSERT INTO events (materia, title, event_link, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp)
        VALUES (
          ${materia}, ${title}, ${event_link || null}, ${start_date}, ${end_date}, ${color},
          ${alert_status || 'pending'},
          ${alert_email !== undefined ? alert_email : true},
          ${alert_whatsapp !== undefined ? alert_whatsapp : false},
          ${alert_hours_email || [24]},
          ${alert_hours_whatsapp || [2]}
        )
        RETURNING *
      `
      return res.json(result[0])
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al crear evento' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
