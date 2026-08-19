'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { requireAdmin } from '@/lib/auth/current-user'
import { recordAuditEntry, resolveUserEmail } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { tasks, users } from '@/lib/db/schema'
import { getOpenTasksForUser, getProjectMemberOptions } from '@/lib/reassignment'

export async function deactivateUserWithReassignmentAction(
  userId: string,
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin()
  const openTasks = await getOpenTasksForUser(userId)
  const oldAssigneeEmail = await resolveUserEmail(userId)

  for (const task of openTasks) {
    const raw = formData.get(`assignee-${task.id}`)
    const submittedId = typeof raw === 'string' && raw !== '' ? raw : null
    // Re-validate against the project's own candidate set — the same one the
    // form's <select> was built from — rather than trusting the submitted id,
    // which a tampered request could set to anything (including the very
    // user being deactivated).
    const validOptions = await getProjectMemberOptions(task.projectId, userId)
    const newAssigneeId = submittedId && validOptions.some((o) => o.id === submittedId) ? submittedId : null

    await db()
      .update(tasks)
      .set({ assigneeId: newAssigneeId, updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
    const newAssigneeEmail = await resolveUserEmail(newAssigneeId)
    await recordAuditEntry('Task', task.id, 'assignee', oldAssigneeEmail, newAssigneeEmail, admin.id)
  }

  await db().update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, userId))
  await recordAuditEntry('User', userId, 'isActive', true, false, admin.id)

  redirect('/admin/users')
}
