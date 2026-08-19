'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/current-user'
import { createPasswordSetToken } from '@/lib/auth/password-reset'
import { absoluteUrl } from '@/lib/base-url'
import { recordAuditEntry } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { getOpenTasksForUser } from '@/lib/reassignment'

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['Administrator', 'User']),
})

export type FormState = { error?: string; resetLink?: string } | undefined

export async function createUserAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = createUserSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    role: formData.get('role'),
  })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const existing = await db().select().from(users).where(eq(users.email, parsed.data.email)).limit(1)
  if (existing.length > 0) return { error: 'Esiste già un utente con questa email.' }

  const [created] = await db().insert(users).values(parsed.data).returning()

  await recordAuditEntry('User', created.id, 'creation', null, parsed.data.email, admin.id)

  const rawToken = await createPasswordSetToken(created.id, admin.id)
  const link = await absoluteUrl(`/set-password/${rawToken}`)

  revalidatePath('/admin/users')
  return { resetLink: link }
}

export async function updateUserRoleAction(userId: string, role: 'Administrator' | 'User'): Promise<void> {
  const admin = await requireAdmin()
  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user || user.role === role) return

  await db().update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId))
  await recordAuditEntry('User', userId, 'role', user.role, role, admin.id)
  revalidatePath('/admin/users')
}

export async function generateResetLinkAction(userId: string): Promise<string> {
  const admin = await requireAdmin()
  const rawToken = await createPasswordSetToken(userId, admin.id)
  return absoluteUrl(`/set-password/${rawToken}`)
}

export async function reactivateUserAction(userId: string): Promise<void> {
  const admin = await requireAdmin()
  await db().update(users).set({ isActive: true, updatedAt: new Date() }).where(eq(users.id, userId))
  await recordAuditEntry('User', userId, 'isActive', false, true, admin.id)
  revalidatePath('/admin/users')
}

/** Deactivates directly — only safe to call when the user has no open tasks. */
export async function deactivateUserAction(userId: string): Promise<{ error?: string }> {
  const admin = await requireAdmin()
  const openTasks = await getOpenTasksForUser(userId)
  if (openTasks.length > 0) {
    return { error: 'Questo utente ha task aperti: usa la pagina di disattivazione guidata.' }
  }

  await db().update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, userId))
  await recordAuditEntry('User', userId, 'isActive', true, false, admin.id)
  revalidatePath('/admin/users')
  return {}
}
