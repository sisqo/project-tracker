import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

export type CurrentUser = typeof users.$inferSelect

/**
 * Loads the current user fresh from the database on every call — role and
 * isActive can change between requests (an Administrator can demote or
 * deactivate someone mid-session), and the JWT is not trusted for either.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const [user] = await db().select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user || !user.isActive) return null

  return user
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (user.role !== 'Administrator') redirect('/')
  return user
}
