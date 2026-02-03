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
  const { id } = req.query

  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  if (req.method === 'PUT') {
    const { materia, title, start_date, end_date, color, alert_status } = req.body

    try {
      const result = await sql`
        UPDATE events 
        SET materia = ${materia}, title = ${title}, start_date = ${start_date}, 
            end_date = ${end_date}, color = ${color}, alert_status = ${alert_status}
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