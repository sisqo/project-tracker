'use server'

import { and, eq, gt, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/current-user'
import { recordAuditEntries, resolveUserEmail } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { checklistItems, projects, tasks } from '@/lib/db/schema'
import { canOperateOnProject, isValidAssignee } from '@/lib/permissions'
import { getProjectMemberIds } from '@/lib/queries/projects'

async function loadTaskAndAssertOperable(projectId: string, taskId: string) {
  const user = await requireUser()
  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new Error('Progetto non trovato.')
  const memberIds = await getProjectMemberIds(projectId)
  if (!canOperateOnProject(user, project, memberIds)) throw new Error('Non autorizzato.')
  const [task] = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task) throw new Error('Task non trovato.')
  return { user, project, memberIds, task }
}

const updateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
  assigneeId: z.string().optional(),
})

export type FormState = { error?: string } | undefined

export async function updateTaskAction(
  projectId: string,
  taskId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, project, memberIds, task } = await loadTaskAndAssertOperable(projectId, taskId)

  const parsed = updateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate') || undefined,
    estimatedHours: formData.get('estimatedHours') || undefined,
    assigneeId: formData.get('assigneeId') || undefined,
  })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const assigneeId = parsed.data.assigneeId || null
  if (!(await isValidAssignee(assigneeId, project, memberIds))) {
    return { error: "L'assegnatario deve essere un membro attivo del progetto." }
  }

  const next = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate ?? null,
    estimatedHours: parsed.data.estimatedHours ?? null,
    assigneeId,
  }

  await db().update(tasks).set({ ...next, updatedAt: new Date() }).where(eq(tasks.id, taskId))

  const [oldAssigneeEmail, newAssigneeEmail] = await Promise.all([
    resolveUserEmail(task.assigneeId),
    resolveUserEmail(assigneeId),
  ])

  await recordAuditEntries(
    'Task',
    taskId,
    [
      { field: 'assignee', oldValue: oldAssigneeEmail, newValue: newAssigneeEmail },
      { field: 'dueDate', oldValue: task.dueDate, newValue: next.dueDate },
      { field: 'priority', oldValue: task.priority, newValue: next.priority },
    ],
    user.id,
  )

  revalidatePath(`/projects/${projectId}/tasks/${taskId}`)
  revalidatePath(`/projects/${projectId}`)
  return undefined
}

export async function addChecklistItemAction(projectId: string, taskId: string, formData: FormData): Promise<void> {
  await loadTaskAndAssertOperable(projectId, taskId)
  const text = String(formData.get('text') ?? '').trim()
  if (!text) return

  const [{ maxOrder }] = await db()
    .select({ maxOrder: sql<number>`coalesce(max(${checklistItems.sortOrder}), -1)::int` })
    .from(checklistItems)
    .where(eq(checklistItems.taskId, taskId))

  await db().insert(checklistItems).values({ taskId, text, sortOrder: maxOrder + 1 })
  revalidatePath(`/projects/${projectId}/tasks/${taskId}`)
}

export async function toggleChecklistItemAction(projectId: string, taskId: string, itemId: string, isDone: boolean): Promise<void> {
  await loadTaskAndAssertOperable(projectId, taskId)
  await db().update(checklistItems).set({ isDone, updatedAt: new Date() }).where(eq(checklistItems.id, itemId))
  revalidatePath(`/projects/${projectId}/tasks/${taskId}`)
}

export async function deleteChecklistItemAction(projectId: string, taskId: string, itemId: string): Promise<void> {
  await loadTaskAndAssertOperable(projectId, taskId)
  await db().delete(checklistItems).where(eq(checklistItems.id, itemId))
  revalidatePath(`/projects/${projectId}/tasks/${taskId}`)
}

export async function moveChecklistItemAction(
  projectId: string,
  taskId: string,
  itemId: string,
  direction: 'up' | 'down',
): Promise<void> {
  await loadTaskAndAssertOperable(projectId, taskId)

  const [item] = await db().select().from(checklistItems).where(eq(checklistItems.id, itemId)).limit(1)
  if (!item) return

  const neighborCondition =
    direction === 'up'
      ? and(eq(checklistItems.taskId, taskId), sql`${checklistItems.sortOrder} < ${item.sortOrder}`)
      : and(eq(checklistItems.taskId, taskId), gt(checklistItems.sortOrder, item.sortOrder))

  const [neighbor] = await db()
    .select()
    .from(checklistItems)
    .where(neighborCondition)
    .orderBy(direction === 'up' ? sql`${checklistItems.sortOrder} desc` : sql`${checklistItems.sortOrder} asc`)
    .limit(1)
  if (!neighbor) return

  await db().update(checklistItems).set({ sortOrder: neighbor.sortOrder }).where(eq(checklistItems.id, item.id))
  await db().update(checklistItems).set({ sortOrder: item.sortOrder }).where(eq(checklistItems.id, neighbor.id))

  revalidatePath(`/projects/${projectId}/tasks/${taskId}`)
}
