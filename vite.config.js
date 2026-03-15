import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import express from 'express'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config()

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      const app = express()
      app.use(express.json())

      const sql = neon(process.env.DATABASE_URL)
      const resend = new Resend(process.env.RESEND_API_KEY)

      const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

      const verifyAdmin = async (req, res, next) => {
        const authHeader = req.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const token = authHeader.slice(7)
            if (token && token !== 'undefined') {
              const response = await fetch(`${process.env.VITE_NEON_AUTH_URL}/get-session`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              if (response.ok) {
                const session = await response.json()
                if (session?.user && ALLOWED_EMAILS.includes(session.user.email?.toLowerCase())) {
                  req.user = session.user
                  return next()
                }
              }
            }
          } catch {}
        }
        next()
      }

      app.get('/api/check-access', async (req, res) => {
        try {
          const token = req.headers.authorization?.slice(7)
          if (!token || token === 'undefined') return res.json({ allowed: false })
          const response = await fetch(`${process.env.VITE_NEON_AUTH_URL}/get-session`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!response.ok) return res.json({ allowed: false })
          const session = await response.json()
          const user = session?.user
          res.json({ allowed: !!(user && ALLOWED_EMAILS.includes(user.email?.toLowerCase())), email: user?.email })
        } catch { res.json({ allowed: false }) }
      })

      app.get('/api/events', async (req, res) => {
        try {
          const events = await sql`SELECT * FROM events ORDER BY start_date ASC`
          res.json(events)
        } catch (e) { res.status(500).json({ error: 'Error del servidor' }) }
      })

      app.post('/api/events', verifyAdmin, async (req, res) => {
        try {
          const { materia, title, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp } = req.body
          const result = await sql`
            INSERT INTO events (materia, title, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp)
            VALUES (${materia}, ${title}, ${start_date}, ${end_date}, ${color},
              ${alert_status || 'pending'},
              ${alert_email !== undefined ? alert_email : true},
              ${alert_whatsapp !== undefined ? alert_whatsapp : false},
              ${alert_hours_email || [24]},
              ${alert_hours_whatsapp || [2]})
            RETURNING *`
          res.json(result[0])
        } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }) }
      })

      app.put('/api/events/:id', verifyAdmin, async (req, res) => {
        try {
          const { materia, title, start_date, end_date, color, alert_status, alert_email, alert_whatsapp, alert_hours_email, alert_hours_whatsapp } = req.body
          const result = await sql`
            UPDATE events SET
              materia = ${materia}, title = ${title}, start_date = ${start_date},
              end_date = ${end_date}, color = ${color}, alert_status = ${alert_status},
              alert_email = ${alert_email !== undefined ? alert_email : true},
              alert_whatsapp = ${alert_whatsapp !== undefined ? alert_whatsapp : false},
              alert_hours_email = ${alert_hours_email || [24]},
              alert_hours_whatsapp = ${alert_hours_whatsapp || [2]}
            WHERE id = ${req.params.id} RETURNING *`
          res.json(result[0])
        } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }) }
      })

      app.delete('/api/events/:id', verifyAdmin, async (req, res) => {
        try {
          await sql`DELETE FROM events WHERE id = ${req.params.id}`
          res.json({ success: true })
        } catch (e) { res.status(500).json({ error: 'Error del servidor' }) }
      })

      app.post('/api/events/:id/alert', verifyAdmin, async (req, res) => {
        try {
          const events = await sql`SELECT * FROM events WHERE id = ${req.params.id}`
          if (!events.length) return res.status(404).json({ error: 'Evento no encontrado' })
          const event = events[0]
          const contacts = await sql`SELECT email FROM contacts`
          if (!contacts.length) return res.status(400).json({ error: 'No hay contactos registrados' })
          const startDate = new Date(event.start_date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
          const fromAddress = `Calendario UNSL <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
          for (const c of contacts) {
            await resend.emails.send({
              from: fromAddress, to: c.email,
              subject: `Recordatorio: ${event.title}`,
              html: `<h2>${event.materia}</h2><p><strong>${event.title}</strong></p><p>Fecha: ${startDate}</p>`
            })
          }
          await sql`UPDATE events SET estado_alerta = 'enviado' WHERE id = ${req.params.id}`
          res.json({ success: true, message: `Alerta enviada a ${contacts.length} contacto(s)` })
        } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Error al enviar alerta' }) }
      })

      app.get('/api/contacts', verifyAdmin, async (req, res) => {
        try {
          const contacts = await sql`SELECT * FROM contacts ORDER BY id ASC`
          res.json(contacts)
        } catch (e) { res.status(500).json({ error: 'Error del servidor' }) }
      })

      app.post('/api/contacts', verifyAdmin, async (req, res) => {
        try {
          const { email, phone } = req.body
          const result = await sql`INSERT INTO contacts (email, phone) VALUES (${email}, ${phone}) RETURNING *`
          res.json(result[0])
        } catch (e) { res.status(500).json({ error: 'Error del servidor' }) }
      })

      app.delete('/api/contacts/:id', verifyAdmin, async (req, res) => {
        try {
          await sql`DELETE FROM contacts WHERE id = ${req.params.id}`
          res.json({ success: true })
        } catch (e) { res.status(500).json({ error: 'Error del servidor' }) }
      })

      server.middlewares.use(app)
    }
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
})
