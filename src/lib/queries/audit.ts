import { desc, eq, inArray, or } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { auditEntries, tasks, users } from '@/lib/db/schema'

export async function getProjectAuditEntries(projectId: string) {
  const taskRows = await db().select({ id: tasks.id, title: tasks.title }).from(tasks).where(eq(tasks.projectId, projectId))
  const taskTitleById = new Map(taskRows.map((t) => [t.id, t.title]))
  const taskIds = taskRows.map((t) => t.id)

  const entries = await db()
    .select({
      id: auditEntries.id,
      entityType: auditEntries.entityType,
      entityId: auditEntries.entityId,
      field: auditEntries.field,
      oldValue: auditEntries.oldValue,
      newValue: auditEntries.newValue,
      changedAt: auditEntries.changedAt,
      changedById: auditEntries.changedById,
      changedByFirstName: users.firstName,
      changedByLastName: users.lastName,
    })
    .from(auditEntries)
    .innerJoin(users, eq(auditEntries.changedById, users.id))
    .where(
      taskIds.length > 0
        ? or(eq(auditEntries.entityId, projectId), inArray(auditEntries.entityId, taskIds))
        : eq(auditEntries.entityId, projectId),
    )
    .orderBy(desc(auditEntries.changedAt))

  return entries.map((e) => ({
    ...e,
    taskTitle: e.entityType === 'Task' ? (taskTitleById.get(e.entityId) ?? e.entityId) : null,
  }))
}

export type ProjectAuditEntry = Awaited<ReturnType<typeof getProjectAuditEntries>>[number]
