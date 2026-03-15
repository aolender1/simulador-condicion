import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const DATABASE_URL = process.env.DATABASE_URL

async function migrate() {
  const sql = neon(DATABASE_URL)

  console.log('Ejecutando migración: canales de alerta y horas automáticas...')

  // alert_email: si se notifica por email
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_email BOOLEAN DEFAULT true`
  console.log('✓ Columna alert_email agregada')

  // alert_whatsapp: si se notifica por whatsapp
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_whatsapp BOOLEAN DEFAULT false`
  console.log('✓ Columna alert_whatsapp agregada')

  // alert_hours: arreglo de horas antes del evento para notificar automáticamente. Ej: [2, 24]
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_hours INTEGER[] DEFAULT '{2}'`
  console.log('✓ Columna alert_hours agregada')

  // alert_status: aseguramos que exista con el nombre correcto
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_status VARCHAR(20) DEFAULT 'pending'`
  console.log('✓ Columna alert_status verificada')

  console.log('')
  console.log('✅ Migración completada!')
}

migrate().catch(console.error)
