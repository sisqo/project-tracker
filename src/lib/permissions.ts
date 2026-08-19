import { eq } from 'drizzle-orm'

import type { CurrentUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { users, type projects } from '@/lib/db/schema'

export type ProjectRow = typeof projects.$inferSelect

/** Owner and Administrator can edit project data, membership, tags, status. */
export function canManageProject(user: CurrentUser, project: ProjectRow): boolean {
  return user.role === 'Administrator' || user.id === project.ownerId
}

/**
 * Owner (implicitly a member) or an explicit member can operate on tasks:
 * create/edit, change status/checklist, upload attachments, comment.
 */
export function canOperateOnProject(user: CurrentUser, project: ProjectRow, memberIds: string[]): boolean {
  if (user.role === 'Administrator') return true
  if (user.id === project.ownerId) return true
  return memberIds.includes(user.id)
}

/**
 * `Task.assignee` must be the owner or an active member of the task's
 * project — checked here, not just against the id sets, because a member who
 * has since been deactivated stays in `project_members` (deactivation only
 * reassigns their existing tasks, see lib/reassignment.ts) and must not be
 * assignable to a new one.
 */
export async function isValidAssignee(
  assigneeId: string | null,
  project: { ownerId: string },
  memberIds: string[],
): Promise<boolean> {
  if (!assigneeId) return true
  if (assigneeId !== project.ownerId && !memberIds.includes(assigneeId)) return false

  const [user] = await db().select({ isActive: users.isActive }).from(users).where(eq(users.id, assigneeId)).limit(1)
  return user?.isActive ?? false
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate) return false
  if (status === 'Completed' || status === 'Cancelled') return false
  return new Date(dueDate).getTime() < startOfToday().getTime()
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}
