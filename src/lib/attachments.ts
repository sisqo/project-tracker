import { File as NodeFile } from 'node:buffer'

import { eq } from 'drizzle-orm'

import type { CurrentUser } from '@/lib/auth/current-user'
import { MAX_ATTACHMENT_BYTES, uploadAttachmentFile } from '@/lib/blob'
import { db } from '@/lib/db/client'
import { attachments, projects } from '@/lib/db/schema'
import { canOperateOnProject } from '@/lib/permissions'
import { getProjectMemberIds } from '@/lib/queries/projects'

export async function assertCanAttach(projectId: string, user: CurrentUser) {
  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new Error('Progetto non trovato.')
  const memberIds = await getProjectMemberIds(projectId)
  if (!canOperateOnProject(user, project, memberIds)) throw new Error('Non autorizzato.')
  return project
}

type ParentType = 'Project' | 'Task'

/**
 * `formData.get('file')` should be a DOM `File`, but Node 18 has no global
 * `File` — Next's multipart parser constructs entries with `node:buffer`'s
 * `File` instead, which isn't the same class the DOM lib types check against.
 * `instanceof File` against the global would throw a `ReferenceError` outright.
 */
export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof NodeFile
}

export async function createFileAttachment(opts: {
  parentType: ParentType
  parentId: string
  uploadedById: string
  file: File
  label: string
}): Promise<{ error?: string }> {
  if (opts.file.size === 0) return { error: 'Seleziona un file.' }
  if (opts.file.size > MAX_ATTACHMENT_BYTES) return { error: 'Il file supera i 10 MB consentiti.' }

  const blob = await uploadAttachmentFile(opts.file, `${opts.parentType.toLowerCase()}/${opts.parentId}`)

  await db().insert(attachments).values({
    parentType: opts.parentType,
    parentId: opts.parentId,
    type: 'File',
    label: opts.label || opts.file.name,
    fileRef: blob.url,
    uploadedById: opts.uploadedById,
  })

  return {}
}

export async function createLinkAttachment(opts: {
  parentType: ParentType
  parentId: string
  uploadedById: string
  url: string
  label: string
}): Promise<{ error?: string }> {
  if (!/^https?:\/\//i.test(opts.url)) return { error: 'Inserisci un URL valido (http/https).' }

  await db().insert(attachments).values({
    parentType: opts.parentType,
    parentId: opts.parentId,
    type: 'Link',
    label: opts.label || opts.url,
    url: opts.url,
    uploadedById: opts.uploadedById,
  })

  return {}
}

export function canDeleteAttachment(
  user: CurrentUser,
  attachment: { uploadedById: string },
  project: { ownerId: string },
): boolean {
  return user.role === 'Administrator' || user.id === project.ownerId || user.id === attachment.uploadedById
}

export async function deleteAttachmentRow(id: string): Promise<void> {
  await db().delete(attachments).where(eq(attachments.id, id))
}
