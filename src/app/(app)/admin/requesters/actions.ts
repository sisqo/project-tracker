'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/current-user'
import { recordAuditEntry } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { requesters } from '@/lib/db/schema'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  unitId: z.string().uuid(),
})

export type FormState = { error?: string } | undefined

export async function createRequesterAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = schema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    unitId: formData.get('unitId'),
  })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const [created] = await db().insert(requesters).values(parsed.data).returning()
  await recordAuditEntry(
    'Requester',
    created.id,
    'creation',
    null,
    `${parsed.data.firstName} ${parsed.data.lastName}`,
    admin.id,
  )

  revalidatePath('/admin/requesters')
  return undefined
}

export async function setRequesterActiveAction(id: string, isActive: boolean): Promise<void> {
  const admin = await requireAdmin()
  await db().update(requesters).set({ isActive, updatedAt: new Date() }).where(eq(requesters.id, id))
  await recordAuditEntry('Requester', id, 'isActive', !isActive, isActive, admin.id)
  revalidatePath('/admin/requesters')
}
