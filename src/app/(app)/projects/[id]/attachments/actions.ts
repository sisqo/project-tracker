'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/current-user'
import {
  assertCanAttach,
  canDeleteAttachment,
  createFileAttachment,
  createLinkAttachment,
  deleteAttachmentRow,
  isUploadedFile,
} from '@/lib/attachments'
import { db } from '@/lib/db/client'
import { attachments } from '@/lib/db/schema'

export async function addProjectFileAttachmentAction(
  projectId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser()
  await assertCanAttach(projectId, user)

  const file = formData.get('file')
  const label = String(formData.get('label') ?? '')
  if (!isUploadedFile(file)) return { error: 'Seleziona un file.' }

  const result = await createFileAttachment({ parentType: 'Project', parentId: projectId, uploadedById: user.id, file, label })
  revalidatePath(`/projects/${projectId}`)
  return result
}

export async function addProjectLinkAttachmentAction(
  projectId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser()
  await assertCanAttach(projectId, user)

  const url = String(formData.get('url') ?? '')
  const label = String(formData.get('label') ?? '')

  const result = await createLinkAttachment({ parentType: 'Project', parentId: projectId, uploadedById: user.id, url, label })
  revalidatePath(`/projects/${projectId}`)
  return result
}

export async function deleteProjectAttachmentAction(projectId: string, attachmentId: string): Promise<void> {
  const user = await requireUser()
  const project = await assertCanAttach(projectId, user)

  const [attachment] = await db().select().from(attachments).where(eq(attachments.id, attachmentId)).limit(1)
  if (!attachment) return
  if (!canDeleteAttachment(user, attachment, project)) throw new Error('Non autorizzato.')

  await deleteAttachmentRow(attachmentId)
  revalidatePath(`/projects/${projectId}`)
}
