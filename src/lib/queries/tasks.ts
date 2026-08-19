import { asc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { db } from '@/lib/db/client'
import { tasks, users } from '@/lib/db/schema'

export const TASK_STATUSES = ['Todo', 'InProgress', 'Waiting', 'Completed', 'Cancelled'] as const

export async function getProjectTasks(projectId: string) {
  const assignee = alias(users, 'assignee_user')

  const rows = await db()
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      sortOrder: tasks.sortOrder,
      assigneeId: tasks.assigneeId,
      assigneeFirstName: assignee.firstName,
      assigneeLastName: assignee.lastName,
    })
    .from(tasks)
    .leftJoin(assignee, eq(tasks.assigneeId, assignee.id))
    .where(eq(tasks.projectId, projectId))
    .orderBy(
      sql`case ${tasks.status}
        when 'Todo' then 0 when 'InProgress' then 1 when 'Waiting' then 2
        when 'Completed' then 3 else 4 end`,
      asc(tasks.sortOrder),
    )

  return rows
}

export type ProjectTaskRow = Awaited<ReturnType<typeof getProjectTasks>>[number]
