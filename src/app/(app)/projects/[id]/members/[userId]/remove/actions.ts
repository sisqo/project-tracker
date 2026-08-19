'use server'

import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth/current-user'
import { recordAuditEntry, resolveUserEmail, serializeSet } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { projectMembers, projects, tasks, users } from '@/lib/db/schema'
import { canManageProject } from '@/lib/permissions'
import { getOpenTasksForProjectMember, getProjectMemberOptions } from '@/lib/reassignment'

export async function removeMemberWithReassignmentAction(
  projectId: string,
  userId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser()
  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project || !canManageProject(user, project)) throw new Error('Non autorizzato.')

  const openTasks = await getOpenTasksForProjectMember(projectId, userId)
  const oldAssigneeEmail = await resolveUserEmail(userId)
  // Same candidate set the form's <select> was built from — re-validated
  // here rather than trusting the submitted id, which a tampered request
  // could set to anything, including the member being removed.
  const validOptions = await getProjectMemberOptions(projectId, userId)
  for (const task of openTasks) {
    const raw = formData.get(`assignee-${task.id}`)
    const submittedId = typeof raw === 'string' && raw !== '' ? raw : null
    const newAssigneeId = submittedId && validOptions.some((o) => o.id === submittedId) ? submittedId : null
    await db().update(tasks).set({ assigneeId: newAssigneeId, updatedAt: new Date() }).where(eq(tasks.id, task.id))
    const newAssigneeEmail = await resolveUserEmail(newAssigneeId)
    await recordAuditEntry('Task', task.id, 'assignee', oldAssigneeEmail, newAssigneeEmail, user.id)
  }

  const beforeRows = await db()
    .select({ email: users.email })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))
  const before = beforeRows.map((r) => r.email)

  await db().delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))

  const afterRows = await db()
    .select({ email: users.email })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))
  const after = afterRows.map((r) => r.email)

  await recordAuditEntry('Project', projectId, 'members', serializeSet(before), serializeSet(after), user.id)

  redirect(`/projects/${projectId}`)
}
