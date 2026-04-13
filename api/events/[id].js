import { neon } from '@neondatabase/serverless'

const ALLOWED_EMAILS = [
  'albertolender@gmail.com',
  'lynchjonai@gmail.com',
  'maxipadilla.unsl@gmail.com',
  'supremacyaaa@gmail.com',
  'valeriamorenoarg@gmail.com',
  'rominaflorenciaramos93@gmail.com'
]

async function verifySession(req, sql) {
  try {
    // Extract better-auth session token from cookies
    const cookieHeader = req.headers.cookie || ''
    const match = cookieHeader.match(/(?:^|;\s*)better-auth\.session_token=([^;]+)/)
    if (!match) return null
    const token = decodeURIComponent(match[1])

    // Validate token against neon_auth DB tables
    const rows = await sql`
      SELECT u.email FROM neon_auth.session s
      JOIN neon_auth.user u ON u.id = s."userId"
      WHERE s.token = ${token}
        AND s."expiresAt" > NOW()
    `
    if (!rows.length) return null
    const email = rows[0].email.toLowerCase()
    if (!ALLOWED_EMAILS.includes(email)) return null
    return { email }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL)
  const { id } = req.query

  const user = await verifySession(req, sql)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  if (req.method === 'PUT') {
    const { materia, title, event_link, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp } = req.body

    try {
      const result = await sql`
        UPDATE events 
        SET materia = ${materia}, title = ${title}, event_link = ${event_link || null},
            start_date = ${start_date}, end_date = ${end_date}, color = ${color}, 
            alert_status = ${alert_status},
            alert_email = ${alert_email !== undefined ? alert_email : true},
            alert_whatsapp = ${alert_whatsapp !== undefined ? alert_whatsapp : false},
            alert_hours_email = ${alert_hours_email || [24]},
            alert_hours_whatsapp = ${alert_hours_whatsapp || [2]}
        WHERE id = ${id}
        RETURNING *
      `
      return res.json(result[0])
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al actualizar evento' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM events WHERE id = ${id}`
      return res.json({ success: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al eliminar evento' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
