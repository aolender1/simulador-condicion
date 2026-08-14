import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const ADMINS = ['albertolender@gmail.com', 'valeriamorenoarg@gmail.com']

async function main() {
  for (const email of ADMINS) {
    const res = await sql`
      UPDATE neon_auth.user SET role = 'admin'
      WHERE LOWER(email) = ${email}
      RETURNING email, role
    `
    if (res.length) console.log('OK admin:', res[0].email, '->', res[0].role)
    else console.log('NO ENCONTRADO:', email)
  }
  const admins = await sql`SELECT email, role FROM neon_auth.user WHERE role = 'admin'`
  console.log('\nAdmins actuales en DB:')
  admins.forEach(a => console.log(' ', a.email, '|', a.role))
  process.exit(0)
}
main().catch(e => { console.error('ERR', e.message); process.exit(1) })