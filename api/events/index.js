import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

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
    const user = verifyToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { materia, title, start_date, end_date, color, alert_status } = req.body

    try {
      const result = await sql`
        INSERT INTO events (materia, title, start_date, end_date, color, alert_status)
        VALUES (${materia}, ${title}, ${start_date}, ${end_date}, ${color}, ${alert_status || 'pending'})
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