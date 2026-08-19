'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/current-user'
import { recordAuditEntry } from '@/lib/audit'
import { nextProjectCode } from '@/lib/codes'
import { db } from '@/lib/db/client'
import { projects, requesters } from '@/lib/db/schema'

const schema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  requesterId: z.string().uuid(),
  requestDate: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})

export type FormState = { error?: string } | undefined

export async function createProjectAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = schema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    description: formData.get('description') || undefined,
    priority: formData.get('priority'),
    requesterId: formData.get('requesterId'),
    requestDate: formData.get('requestDate') || undefined,
    startDate: formData.get('startDate') || undefined,
    dueDate: formData.get('dueDate') || undefined,
  })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const [requester] = await db().select().from(requesters).where(eq(requesters.id, parsed.data.requesterId)).limit(1)
  if (!requester) return { error: 'Richiedente non valido.' }

  const code = await nextProjectCode(new Date().getFullYear())

  const [created] = await db()
    .insert(projects)
    .values({
      code,
      name: parsed.data.name,
      color: parsed.data.color,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority,
      status: 'Draft',
      requesterId: requester.id,
      requesterUnitId: requester.unitId,
      ownerId: user.id,
      requestDate: parsed.data.requestDate ?? null,
      startDate: parsed.data.startDate ?? null,
      dueDate: parsed.data.dueDate ?? null,
    })
    .returning()

  await recordAuditEntry('Project', created.id, 'creation', null, code, user.id)

  redirect(`/projects/${created.id}`)
}
