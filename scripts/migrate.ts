/** Applies the generated migrations. Run with `npm run db:migrate`. */

import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { loadEnv } from './load-env'

async function main() {
  loadEnv()

  // Migrations run over the direct (unpooled) connection when available —
  // Neon's default DATABASE_URL points at a pooled PgBouncer endpoint, the
  // wrong place to issue schema changes.
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Run `vercel env pull .env.local` first.')
    process.exit(1)
  }

  const sql = postgres(url, { prepare: false, max: 1 })
  const db = drizzle(sql)

  await migrate(db, { migrationsFolder: './drizzle' })
  await sql.end()

  console.log('Migrations applied.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
