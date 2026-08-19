'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/current-user'
import { recordAuditEntry } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { organizationalUnits } from '@/lib/db/schema'

const schema = z.object({ code: z.string().min(1), name: z.string().min(1) })

export type FormState = { error?: string } | undefined

export async function createUnitAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = schema.safeParse({ code: formData.get('code'), name: formData.get('name') })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const existing = await db()
    .select()
    .from(organizationalUnits)
    .where(eq(organizationalUnits.code, parsed.data.code))
    .limit(1)
  if (existing.length > 0) return { error: 'Esiste già un\'unità con questo codice.' }

  const [created] = await db().insert(organizationalUnits).values(parsed.data).returning()
  await recordAuditEntry('OrganizationalUnit', created.id, 'creation', null, parsed.data.code, admin.id)

  revalidatePath('/admin/units')
  return undefined
}

export async function setUnitActiveAction(id: string, isActive: boolean): Promise<void> {
  const admin = await requireAdmin()
  await db().update(organizationalUnits).set({ isActive, updatedAt: new Date() }).where(eq(organizationalUnits.id, id))
  await recordAuditEntry('OrganizationalUnit', id, 'isActive', !isActive, isActive, admin.id)
  revalidatePath('/admin/units')
}
