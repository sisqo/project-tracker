import { and, asc, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { organizationalUnits, projects, tasks, users } from '@/lib/db/schema'

const OPEN_TASK_STATUSES = ['Todo', 'InProgress', 'Waiting'] as const

export type UpcomingDeadline = {
  id: string
  label: string
  dueDate: string
  kind: 'project' | 'task'
  deltaDays: number
}

export async function getDashboardData(unitId?: string) {
  const activeProjects = eq(projects.isArchived, false)
  const projectConditions = unitId ? and(activeProjects, eq(projects.requesterUnitId, unitId)) : activeProjects

  const [byStatus, overdueAgg, byUnit, taskAgg, progressAgg, perPerson, upcomingProjects, upcomingTasks] = await Promise.all([
    db()
      .select({ status: projects.status, count: sql<number>`count(*)::int` })
      .from(projects)
      .where(projectConditions)
      .groupBy(projects.status),
    db()
      .select({
        count: sql<number>`count(*)::int`,
        avgDaysOverdue: sql<number | null>`avg(current_date - ${projects.dueDate})::int`,
      })
      .from(projects)
      .where(
        and(
          projectConditions,
          isNotNull(projects.dueDate),
          lt(projects.dueDate, sql`current_date`),
          sql`${projects.status} not in ('Completed', 'Cancelled')`,
        ),
      ),
    db()
      .select({ unitId: organizationalUnits.id, unitName: organizationalUnits.name, count: sql<number>`count(*)::int` })
      .from(projects)
      .innerJoin(organizationalUnits, eq(projects.requesterUnitId, organizationalUnits.id))
      .where(projectConditions)
      .groupBy(organizationalUnits.id, organizationalUnits.name)
      .orderBy(sql`count(*) desc`),
    db()
      .select({
        count: sql<number>`count(*)::int`,
        assignees: sql<number>`count(distinct ${tasks.assigneeId})::int`,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(projectConditions, inArray(tasks.status, [...OPEN_TASK_STATUSES]))),
    db()
      .select({ avgProgress: sql<number | null>`avg(${projects.progressPercent})::int` })
      .from(projects)
      .where(and(projectConditions, sql`${projects.status} in ('Active', 'OnHold')`)),
    db()
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        openCount: sql<number>`count(*)::int`,
        overdueCount: sql<number>`count(*) filter (where ${tasks.dueDate} is not null and ${tasks.dueDate} < current_date)::int`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.assigneeId, users.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(projectConditions, inArray(tasks.status, [...OPEN_TASK_STATUSES])))
      .groupBy(users.id, users.firstName, users.lastName)
      .orderBy(sql`count(*) desc`),
    db()
      .select({ id: projects.id, name: projects.name, dueDate: projects.dueDate })
      .from(projects)
      .where(
        and(
          projectConditions,
          isNotNull(projects.dueDate),
          sql`${projects.status} not in ('Completed', 'Cancelled')`,
          sql`${projects.dueDate} <= current_date + interval '14 days'`,
        ),
      )
      .orderBy(asc(projects.dueDate))
      .limit(8),
    db()
      .select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          projectConditions,
          isNotNull(tasks.dueDate),
          sql`${tasks.status} not in ('Completed', 'Cancelled')`,
          sql`${tasks.dueDate} <= current_date + interval '14 days'`,
        ),
      )
      .orderBy(asc(tasks.dueDate))
      .limit(8),
  ])

  const totalProjects = byStatus.reduce((sum, r) => sum + r.count, 0)
  const todayMs = new Date(new Date().toDateString()).getTime()
  const dayMs = 24 * 60 * 60 * 1000

  const deadlines: UpcomingDeadline[] = [
    ...upcomingProjects.map((p) => ({
      id: p.id,
      label: p.name,
      dueDate: p.dueDate as string,
      kind: 'project' as const,
      deltaDays: Math.round((new Date(p.dueDate as string).getTime() - todayMs) / dayMs),
    })),
    ...upcomingTasks.map((t) => ({
      id: t.id,
      label: t.title,
      dueDate: t.dueDate as string,
      kind: 'task' as const,
      deltaDays: Math.round((new Date(t.dueDate as string).getTime() - todayMs) / dayMs),
    })),
  ]
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
    .slice(0, 6)

  return {
    totalProjects,
    byStatus,
    overdueCount: overdueAgg[0]?.count ?? 0,
    avgDaysOverdue: overdueAgg[0]?.avgDaysOverdue ?? null,
    byUnit,
    openTaskCount: taskAgg[0]?.count ?? 0,
    assigneeCount: taskAgg[0]?.assignees ?? 0,
    avgProgress: progressAgg[0]?.avgProgress ?? null,
    perPerson,
    deadlines,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
