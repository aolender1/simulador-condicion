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

  if (req.method === 'GET') {
    try {
      const mails = await sql`SELECT * FROM mails ORDER BY id ASC`
      return res.json(mails)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al obtener emails' })
    }
  }

  if (req.method === 'POST') {
    const { email } = req.body

    try {
      const result = await sql`
        INSERT INTO mails (email) VALUES (${email}) RETURNING *
      `
      return res.json(result[0])
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al agregar email' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}