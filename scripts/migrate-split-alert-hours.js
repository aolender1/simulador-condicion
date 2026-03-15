import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  // Add the two new columns, copying existing alert_hours to both as default
  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS alert_hours_email integer[] DEFAULT '{2,24}',
    ADD COLUMN IF NOT EXISTS alert_hours_whatsapp integer[] DEFAULT '{2,24}'
  `

  // Migrate existing data: copy alert_hours into both new columns
  await sql`
    UPDATE events
    SET
      alert_hours_email = COALESCE(alert_hours, ARRAY[2,24]),
      alert_hours_whatsapp = COALESCE(alert_hours, ARRAY[2,24])
    WHERE alert_hours_email IS NULL OR alert_hours_whatsapp IS NULL
  `

  console.log('Migration complete: alert_hours_email and alert_hours_whatsapp columns added.')
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
