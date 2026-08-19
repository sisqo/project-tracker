/**
 * Guided reassignment — backs both cross-cutting flows from §4: removing a
 * project member with open tasks, and deactivating a user with open tasks
 * anywhere. "Open" means not Completed and not Cancelled.
 */

import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { projectMembers, projects, tasks, users } from '@/lib/db/schema'

const OPEN_STATUSES = ['Todo', 'InProgress', 'Waiting'] as const

export type OpenTask = {
  id: string
  title: string
  projectId: string
  projectName: string
}

export async function getOpenTasksForUser(userId: string): Promise<OpenTask[]> {
  const rows = await db()
    .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId, projectName: projects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(eq(tasks.assigneeId, userId), inArray(tasks.status, [...OPEN_STATUSES])))

  return rows
}

export async function getOpenTasksForProjectMember(projectId: string, userId: string): Promise<OpenTask[]> {
  const rows = await db()
    .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId, projectName: projects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(tasks.assigneeId, userId),
        inArray(tasks.status, [...OPEN_STATUSES]),
      ),
    )

  return rows
}

export type MemberOption = { id: string; name: string }

/**
 * Owner + active explicit members of a project, as reassignment candidates.
 * A deactivated user "isn't selectable" (§4) even if still in
 * `project_members` — deactivation reassigns their existing tasks but
 * doesn't remove membership, so this filter is what actually keeps them out
 * of new assignments.
 */
export async function getProjectMemberOptions(projectId: string, excludeUserId?: string): Promise<MemberOption[]> {
  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) return []

  const memberRows = await db()
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, isActive: users.isActive })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))

  const [owner] = await db()
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, project.ownerId))
    .limit(1)

  const all = owner ? [owner, ...memberRows] : memberRows
  const deduped = new Map(all.map((u) => [u.id, u]))
  if (excludeUserId) deduped.delete(excludeUserId)

  return [...deduped.values()].filter((u) => u.isActive).map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))
}
