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
    console.log('✓ Columna estado_alerta verificada/creada')
  } catch (err) {
    console.log('Columna estado_alerta ya existe o no se pudo crear')
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
  console.log('✓ Tabla contacts verificada')

  console.log('')
  console.log('✅ Setup completado!')
  console.log('')
  console.log('Nota: La autenticación ahora usa Neon Auth con Google.')
  console.log('Solo los emails en ALLOWED_EMAILS pueden acceder al admin.')
}

setup().catch(console.error)