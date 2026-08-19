'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/current-user'
import { recordAuditEntry } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { tags } from '@/lib/db/schema'

const schema = z.object({ name: z.string().min(1), color: z.string().min(1) })

export type FormState = { error?: string } | undefined

export async function createTagAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = schema.safeParse({ name: formData.get('name'), color: formData.get('color') })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const existing = await db().select().from(tags).where(eq(tags.name, parsed.data.name)).limit(1)
  if (existing.length > 0) return { error: 'Esiste già un tag con questo nome.' }

  const [created] = await db().insert(tags).values(parsed.data).returning()
  await recordAuditEntry('Tag', created.id, 'creation', null, parsed.data.name, admin.id)

  revalidatePath('/admin/tags')
  return undefined
}

export async function setTagActiveAction(id: string, isActive: boolean): Promise<void> {
  const admin = await requireAdmin()
  await db().update(tags).set({ isActive, updatedAt: new Date() }).where(eq(tags.id, id))
  await recordAuditEntry('Tag', id, 'isActive', !isActive, isActive, admin.id)
  revalidatePath('/admin/tags')
}
