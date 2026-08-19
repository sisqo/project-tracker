'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/current-user'
import { recordAuditEntries, recordAuditEntry, serializeSet } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { projectMembers, projects, projectTags, tags, tasks, users } from '@/lib/db/schema'
import { canManageProject } from '@/lib/permissions'
import { getOpenTasksForProjectMember } from '@/lib/reassignment'

async function loadProjectOrThrow(id: string) {
  const [project] = await db().select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) throw new Error('Progetto non trovato.')
  return project
}

async function assertCanManage(id: string) {
  const user = await requireUser()
  const project = await loadProjectOrThrow(id)
  if (!canManageProject(user, project)) throw new Error('Non autorizzato.')
  return { user, project }
}

const fieldsSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  requestDate: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})

export type FormState = { error?: string } | undefined

export async function updateProjectFieldsAction(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { user, project } = await assertCanManage(id)
  const parsed = fieldsSchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    description: formData.get('description') || undefined,
    priority: formData.get('priority'),
    requestDate: formData.get('requestDate') || undefined,
    startDate: formData.get('startDate') || undefined,
    dueDate: formData.get('dueDate') || undefined,
  })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const next = {
    name: parsed.data.name,
    color: parsed.data.color,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    requestDate: parsed.data.requestDate ?? null,
    startDate: parsed.data.startDate ?? null,
    dueDate: parsed.data.dueDate ?? null,
  }

  await db().update(projects).set({ ...next, updatedAt: new Date() }).where(eq(projects.id, id))

  await recordAuditEntries(
    'Project',
    id,
    [
      { field: 'name', oldValue: project.name, newValue: next.name },
      { field: 'priority', oldValue: project.priority, newValue: next.priority },
      { field: 'requestDate', oldValue: project.requestDate, newValue: next.requestDate },
      { field: 'startDate', oldValue: project.startDate, newValue: next.startDate },
      { field: 'dueDate', oldValue: project.dueDate, newValue: next.dueDate },
    ].map((c) => ({ ...c, oldValue: c.oldValue ?? null, newValue: c.newValue ?? null })),
    user.id,
  )

  revalidatePath(`/projects/${id}`)
  return undefined
}

export async function updateProgressAction(id: string, progressPercent: number): Promise<void> {
  const { user, project } = await assertCanManage(id)
  const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)))

  await db()
    .update(projects)
    .set({ progressPercent: clamped, progressUpdatedAt: new Date(), updatedAt: new Date() })
    .where(eq(projects.id, id))

  await recordAuditEntry('Project', id, 'progressPercent', project.progressPercent, clamped, user.id)
  revalidatePath(`/projects/${id}`)
}

export type StatusChangeResult = { error?: string; openTaskCount?: number }

export async function updateStatusAction(
  id: string,
  newStatus: string,
  completionDate: string | null,
  confirmed: boolean,
): Promise<StatusChangeResult> {
  const { user, project } = await assertCanManage(id)

  if (newStatus === 'Completed' && !completionDate) {
    return { error: 'Indica la data di completamento.' }
  }

  if (newStatus === 'Completed' && !confirmed) {
    const openTasks = await db()
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.projectId, id), inArray(tasks.status, ['Todo', 'InProgress', 'Waiting'])))
    if (openTasks.length > 0) return { openTaskCount: openTasks.length }
  }

  // A project moved away from Completed no longer has a completion date —
  // otherwise reopening one leaves a stale date behind.
  const nextCompletionDate = newStatus === 'Completed' ? completionDate : null

  await db()
    .update(projects)
    .set({ status: newStatus as (typeof projects.$inferSelect)['status'], completionDate: nextCompletionDate, updatedAt: new Date() })
    .where(eq(projects.id, id))

  await recordAuditEntries(
    'Project',
    id,
    [
      { field: 'status', oldValue: project.status, newValue: newStatus },
      { field: 'completionDate', oldValue: project.completionDate, newValue: nextCompletionDate },
    ],
    user.id,
  )

  revalidatePath(`/projects/${id}`)
  return {}
}

export async function setArchivedAction(id: string, archived: boolean): Promise<void> {
  const { user, project } = await assertCanManage(id)
  await db().update(projects).set({ isArchived: archived, updatedAt: new Date() }).where(eq(projects.id, id))
  await recordAuditEntry('Project', id, 'isArchived', project.isArchived, archived, user.id)
  revalidatePath(`/projects/${id}`)
}

export async function updateOwnerAction(id: string, newOwnerId: string): Promise<void> {
  const { user, project } = await assertCanManage(id)
  if (newOwnerId === project.ownerId) return

  const [oldOwner] = await db().select().from(users).where(eq(users.id, project.ownerId)).limit(1)
  const [newOwner] = await db().select().from(users).where(eq(users.id, newOwnerId)).limit(1)
  if (!newOwner || !newOwner.isActive) return

  const membersBefore = await currentMemberEmails(id)

  await db().update(projects).set({ ownerId: newOwnerId, updatedAt: new Date() }).where(eq(projects.id, id))
  await recordAuditEntry('Project', id, 'owner', oldOwner?.email ?? null, newOwner.email, user.id)

  // The previous owner was only ever an *implicit* member (never a row in
  // project_members — see addMemberAction's guard below). Losing the owner
  // role without becoming an explicit member would strand any task still
  // assigned to them: isValidAssignee requires owner-or-member, and they'd
  // now be neither.
  if (oldOwner) {
    await db().insert(projectMembers).values({ projectId: id, userId: oldOwner.id }).onConflictDoNothing()
    const membersAfter = await currentMemberEmails(id)
    await recordAuditEntry('Project', id, 'members', serializeSet(membersBefore), serializeSet(membersAfter), user.id)
  }

  revalidatePath(`/projects/${id}`)
}

async function currentTagNames(id: string): Promise<string[]> {
  const rows = await db()
    .select({ name: tags.name })
    .from(projectTags)
    .innerJoin(tags, eq(projectTags.tagId, tags.id))
    .where(eq(projectTags.projectId, id))
  return rows.map((r) => r.name)
}

export async function addTagAction(id: string, tagId: string): Promise<void> {
  const { user } = await assertCanManage(id)
  const before = await currentTagNames(id)

  await db().insert(projectTags).values({ projectId: id, tagId }).onConflictDoNothing()

  const after = await currentTagNames(id)
  await recordAuditEntry('Project', id, 'tags', serializeSet(before), serializeSet(after), user.id)
  revalidatePath(`/projects/${id}`)
}

export async function removeTagAction(id: string, tagId: string): Promise<void> {
  const { user } = await assertCanManage(id)
  const before = await currentTagNames(id)

  await db().delete(projectTags).where(and(eq(projectTags.projectId, id), eq(projectTags.tagId, tagId)))

  const after = await currentTagNames(id)
  await recordAuditEntry('Project', id, 'tags', serializeSet(before), serializeSet(after), user.id)
  revalidatePath(`/projects/${id}`)
}

async function currentMemberEmails(id: string): Promise<string[]> {
  const rows = await db()
    .select({ email: users.email })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, id))
  return rows.map((r) => r.email)
}

export async function addMemberAction(id: string, userId: string): Promise<void> {
  const { user, project } = await assertCanManage(id)
  if (userId === project.ownerId) return

  const [candidate] = await db().select({ isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1)
  if (!candidate?.isActive) return

  const before = await currentMemberEmails(id)

  await db().insert(projectMembers).values({ projectId: id, userId }).onConflictDoNothing()

  const after = await currentMemberEmails(id)
  await recordAuditEntry('Project', id, 'members', serializeSet(before), serializeSet(after), user.id)
  revalidatePath(`/projects/${id}`)
}

export type RemoveMemberResult = { blocked?: true }

/** Removes a member directly — only safe when they have no open tasks in this project. */
export async function removeMemberAction(id: string, userId: string): Promise<RemoveMemberResult> {
  const { user } = await assertCanManage(id)

  const openTasks = await getOpenTasksForProjectMember(id, userId)
  if (openTasks.length > 0) return { blocked: true }

  const before = await currentMemberEmails(id)
  await db().delete(projectMembers).where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)))
  const after = await currentMemberEmails(id)

  await recordAuditEntry('Project', id, 'members', serializeSet(before), serializeSet(after), user.id)
  revalidatePath(`/projects/${id}`)
  return {}
}
