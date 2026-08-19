import { and, asc, desc, eq, isNotNull, lt, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { db } from '@/lib/db/client'
import { organizationalUnits, projectMembers, projects, projectTags, requesters, users } from '@/lib/db/schema'

export type ProjectFilters = {
  status?: string
  priority?: string
  ownerId?: string
  unitId?: string
  tagId?: string
  overdueOnly?: boolean
  includeArchived?: boolean
  sort?: string
}

export type ProjectListRow = {
  id: string
  code: string
  name: string
  color: string
  status: string
  priority: string
  progressPercent: number
  progressUpdatedAt: Date | null
  dueDate: string | null
  isArchived: boolean
  requesterName: string
  unitName: string
  ownerName: string
}

export async function getFilteredProjects(filters: ProjectFilters): Promise<ProjectListRow[]> {
  const owner = alias(users, 'owner_user')

  const conditions = []
  if (!filters.includeArchived) conditions.push(eq(projects.isArchived, false))
  if (filters.status) conditions.push(eq(projects.status, filters.status as (typeof projects.$inferSelect)['status']))
  if (filters.priority)
    conditions.push(eq(projects.priority, filters.priority as (typeof projects.$inferSelect)['priority']))
  if (filters.ownerId) conditions.push(eq(projects.ownerId, filters.ownerId))
  if (filters.unitId) conditions.push(eq(projects.requesterUnitId, filters.unitId))
  if (filters.overdueOnly) {
    conditions.push(isNotNull(projects.dueDate))
    conditions.push(lt(projects.dueDate, sql`current_date`))
    conditions.push(sql`${projects.status} not in ('Completed', 'Cancelled')`)
  }
  if (filters.tagId) {
    conditions.push(
      sql`${projects.id} in (select ${projectTags.projectId} from ${projectTags} where ${projectTags.tagId} = ${filters.tagId})`,
    )
  }

  const orderBy = (() => {
    switch (filters.sort) {
      case 'name':
        return [asc(projects.name)]
      case 'priority':
        return [sql`case ${projects.priority} when 'High' then 0 when 'Medium' then 1 else 2 end`]
      case 'dueDate':
        return [sql`${projects.dueDate} is null`, asc(projects.dueDate)]
      default:
        return [desc(projects.createdAt)]
    }
  })()

  const rows = await db()
    .select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
      color: projects.color,
      status: projects.status,
      priority: projects.priority,
      progressPercent: projects.progressPercent,
      progressUpdatedAt: projects.progressUpdatedAt,
      dueDate: projects.dueDate,
      isArchived: projects.isArchived,
      requesterFirstName: requesters.firstName,
      requesterLastName: requesters.lastName,
      unitName: organizationalUnits.name,
      ownerFirstName: owner.firstName,
      ownerLastName: owner.lastName,
    })
    .from(projects)
    .innerJoin(requesters, eq(projects.requesterId, requesters.id))
    .innerJoin(organizationalUnits, eq(projects.requesterUnitId, organizationalUnits.id))
    .innerJoin(owner, eq(projects.ownerId, owner.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderBy)

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    color: r.color,
    status: r.status,
    priority: r.priority,
    progressPercent: r.progressPercent,
    progressUpdatedAt: r.progressUpdatedAt,
    dueDate: r.dueDate,
    isArchived: r.isArchived,
    requesterName: `${r.requesterFirstName} ${r.requesterLastName}`,
    unitName: r.unitName,
    ownerName: `${r.ownerFirstName} ${r.ownerLastName}`,
  }))
}

export function parseProjectFilters(searchParams: Record<string, string | undefined>): ProjectFilters {
  return {
    status: searchParams.status || undefined,
    priority: searchParams.priority || undefined,
    ownerId: searchParams.owner || undefined,
    unitId: searchParams.unit || undefined,
    tagId: searchParams.tag || undefined,
    overdueOnly: searchParams.overdue === '1',
    includeArchived: searchParams.archived === '1',
    sort: searchParams.sort || undefined,
  }
}

export async function getProjectMemberIds(projectId: string): Promise<string[]> {
  const rows = await db().select({ userId: projectMembers.userId }).from(projectMembers).where(eq(projectMembers.projectId, projectId))
  return rows.map((r) => r.userId)
}
