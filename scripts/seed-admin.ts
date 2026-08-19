/**
 * Bootstraps the first Administrator, with a password set directly — the
 * one-time-link flow (see lib/auth/password-reset) needs an existing
 * Administrator to generate the link, so it cannot be used for the very
 * first account.
 *
 * Usage: npm run seed:admin -- --email a@b.com --password 'secret' --first Mario --last Rossi
 */

import bcrypt from 'bcryptjs'

import { loadEnv } from './load-env'

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx === -1 ? undefined : process.argv[idx + 1]
}

async function main() {
  loadEnv()

  const email = arg('email')
  const password = arg('password')
  const firstName = arg('first') ?? 'Admin'
  const lastName = arg('last') ?? 'Istratore'

  if (!email || !password) {
    console.error(
      "Usage: npm run seed:admin -- --email a@b.com --password 'secret' [--first Mario --last Rossi]",
    )
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const { db, closeDatabase } = await import('../src/lib/db/client')
  const { users } = await import('../src/lib/db/schema')
  const { eq } = await import('drizzle-orm')

  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await db().select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    await db()
      .update(users)
      .set({ passwordHash, role: 'Administrator', isActive: true, updatedAt: new Date() })
      .where(eq(users.email, email))
    console.log(`Updated existing user ${email} to Administrator with the given password.`)
  } else {
    await db().insert(users).values({
      email,
      firstName,
      lastName,
      passwordHash,
      role: 'Administrator',
      isActive: true,
    })
    console.log(`Created Administrator ${email}.`)
  }

  await closeDatabase()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
