'use server'

import { and, eq, gt, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/current-user'
import { recordAuditEntry } from '@/lib/audit'
import { db } from '@/lib/db/client'
import { projects, tasks } from '@/lib/db/schema'
import { canOperateOnProject, isValidAssignee } from '@/lib/permissions'
import { getProjectMemberIds } from '@/lib/queries/projects'

async function loadProjectAndAssertOperable(projectId: string) {
  const user = await requireUser()
  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new Error('Progetto non trovato.')
  const memberIds = await getProjectMemberIds(projectId)
  if (!canOperateOnProject(user, project, memberIds)) throw new Error('Non autorizzato.')
  return { user, project, memberIds }
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
  assigneeId: z.string().optional(),
})

export type FormState = { error?: string } | undefined

export async function createTaskAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { project, memberIds } = await loadProjectAndAssertOperable(projectId)

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate') || undefined,
    estimatedHours: formData.get('estimatedHours') || undefined,
    assigneeId: formData.get('assigneeId') || undefined,
  })
  if (!parsed.success) return { error: 'Dati non validi.' }

  const assigneeId = parsed.data.assigneeId || null
  if (!(await isValidAssignee(assigneeId, project, memberIds))) return { error: "L'assegnatario deve essere un membro attivo del progetto." }

  const [{ maxOrder }] = await db()
    .select({ maxOrder: sql<number>`coalesce(max(${tasks.sortOrder}), -1)::int` })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, 'Todo')))

  await db()
    .insert(tasks)
    .values({
      projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ?? null,
      estimatedHours: parsed.data.estimatedHours ?? null,
      assigneeId,
      status: 'Todo',
      sortOrder: maxOrder + 1,
    })

  revalidatePath(`/projects/${projectId}`)
  return undefined
}

export async function updateTaskStatusAction(projectId: string, taskId: string, newStatus: string): Promise<void> {
  const { user } = await loadProjectAndAssertOperable(projectId)

  const [task] = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task || task.status === newStatus) return

  const [{ maxOrder }] = await db()
    .select({ maxOrder: sql<number>`coalesce(max(${tasks.sortOrder}), -1)::int` })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, newStatus as (typeof tasks.$inferSelect)['status'])))

  await db()
    .update(tasks)
    .set({ status: newStatus as (typeof tasks.$inferSelect)['status'], sortOrder: maxOrder + 1, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))

  await recordAuditEntry('Task', taskId, 'status', task.status, newStatus, user.id)
  revalidatePath(`/projects/${projectId}`)
}

export async function moveTaskAction(projectId: string, taskId: string, direction: 'up' | 'down'): Promise<void> {
  await loadProjectAndAssertOperable(projectId)

  const [task] = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task) return

  const neighborCondition =
    direction === 'up'
      ? and(eq(tasks.projectId, projectId), eq(tasks.status, task.status), sql`${tasks.sortOrder} < ${task.sortOrder}`)
      : and(eq(tasks.projectId, projectId), eq(tasks.status, task.status), gt(tasks.sortOrder, task.sortOrder))

  const [neighbor] = await db()
    .select()
    .from(tasks)
    .where(neighborCondition)
    .orderBy(direction === 'up' ? sql`${tasks.sortOrder} desc` : sql`${tasks.sortOrder} asc`)
    .limit(1)
  if (!neighbor) return

  await db().update(tasks).set({ sortOrder: neighbor.sortOrder }).where(eq(tasks.id, task.id))
  await db().update(tasks).set({ sortOrder: task.sortOrder }).where(eq(tasks.id, neighbor.id))

  revalidatePath(`/projects/${projectId}`)
}
