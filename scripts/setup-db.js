import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const DATABASE_URL = process.env.DATABASE_URL

async function setup() {
  const sql = neon(DATABASE_URL)

  console.log('Actualizando base de datos...')

  // Crear tabla events si no existe
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      materia VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      color VARCHAR(20) DEFAULT '#3788d8',
      estado_alerta VARCHAR(20) DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Agregar columna estado_alerta si no existe (para tablas existentes)
  try {
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS estado_alerta VARCHAR(20) DEFAULT 'pendiente'`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_status VARCHAR(20) DEFAULT 'pending'`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_link TEXT`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_email BOOLEAN DEFAULT true`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_whatsapp BOOLEAN DEFAULT false`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_hours_email INTEGER[] DEFAULT '{24}'`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS alert_hours_whatsapp INTEGER[] DEFAULT '{2}'`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS email_alert_sent BOOLEAN DEFAULT false`
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS whatsapp_alert_sent BOOLEAN DEFAULT false`
    console.log('✓ Columnas adicionales verificadas/creadas')
  } catch (err) {
    console.log('Error al verificar/crear columnas adicionales:', err)
  }

  console.log('✓ Tabla events verificada')

  // Crear tabla contacts si no existe  
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Agregar columnas de canales de envío si no existen
  try {
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS enabled_email BOOLEAN DEFAULT true`
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS enabled_whatsapp BOOLEAN DEFAULT true`
    console.log('✓ Columnas de contactos verificadas/creadas')
  } catch (err) {
    console.log('Error al verificar/crear columnas de contactos:', err)
  }

  console.log('✓ Tabla contacts verificada')

  console.log('')
  console.log('✅ Setup completado!')
  console.log('')
  console.log('Nota: La autenticación ahora usa Neon Auth con Google.')
  console.log('Solo los usuarios con rol admin en neon_auth.user pueden acceder al admin.')
  console.log('Ejecuta: node scripts/set-admin-roles.js para definir los admins.')
}

setup().catch(console.error)