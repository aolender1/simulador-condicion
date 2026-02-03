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
  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  const sql = neon(process.env.DATABASE_URL)
  const { id } = req.query

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM mails WHERE id = ${id}`
      return res.json({ success: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al eliminar email' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}