import { and, asc, desc, eq, isNotNull, lt, or, sql } from 'drizzle-orm'
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
  // "Archiviati" tab — only archived projects, distinct from includeArchived
  // (which means "also show archived among everything else").
  archivedOnly?: boolean
  // "Miei" tab — projects where the given user is owner or a member.
  mineUserId?: string
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
  completionDate: string | null
  isArchived: boolean
  openTaskCount: number
  requesterName: string
  unitName: string
  ownerName: string
}

function buildProjectConditions(filters: ProjectFilters) {
  const conditions = []
  if (filters.archivedOnly) {
    conditions.push(eq(projects.isArchived, true))
  } else if (!filters.includeArchived) {
    conditions.push(eq(projects.isArchived, false))
  }
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
  if (filters.mineUserId) {
    conditions.push(
      or(
        eq(projects.ownerId, filters.mineUserId),
        sql`${projects.id} in (select ${projectMembers.projectId} from ${projectMembers} where ${projectMembers.userId} = ${filters.mineUserId})`,
      ),
    )
  }
  return conditions
}

export async function getFilteredProjects(filters: ProjectFilters): Promise<ProjectListRow[]> {
  const owner = alias(users, 'owner_user')
  const conditions = buildProjectConditions(filters)

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
      completionDate: projects.completionDate,
      isArchived: projects.isArchived,
      openTaskCount: sql<number>`(
        select count(*)::int from tasks
        where tasks.project_id = ${projects.id} and tasks.status not in ('Completed', 'Cancelled')
      )`,
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
    completionDate: r.completionDate,
    isArchived: r.isArchived,
    openTaskCount: r.openTaskCount,
    requesterName: `${r.requesterFirstName} ${r.requesterLastName}`,
    unitName: r.unitName,
    ownerName: `${r.ownerFirstName} ${r.ownerLastName}`,
  }))
}

export type ProjectListCounts = {
  all: number
  active: number
  overdue: number
  mine: number
  archived: number
}

export async function getProjectListCounts(baseFilters: ProjectFilters, userId: string): Promise<ProjectListCounts> {
  async function count(filters: ProjectFilters) {
    const conditions = buildProjectConditions(filters)
    const [row] = await db()
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    return row?.count ?? 0
  }

  const { status: _status, overdueOnly: _overdueOnly, mineUserId: _mineUserId, archivedOnly: _archivedOnly, ...rest } = baseFilters
  void _status
  void _overdueOnly
  void _mineUserId
  void _archivedOnly

  const [all, active, overdue, mine, archived] = await Promise.all([
    count(rest),
    count({ ...rest, status: 'Active' }),
    count({ ...rest, overdueOnly: true }),
    count({ ...rest, mineUserId: userId }),
    count({ ...rest, archivedOnly: true }),
  ])

  return { all, active, overdue, mine, archived }
}

export const PROJECT_TABS = ['all', 'active', 'overdue', 'mine', 'archived'] as const
export type ProjectTab = (typeof PROJECT_TABS)[number]

export function parseProjectTab(value: string | undefined): ProjectTab {
  return (PROJECT_TABS as readonly string[]).includes(value ?? '') ? (value as ProjectTab) : 'all'
}

export function parseProjectFilters(searchParams: Record<string, string | undefined>, currentUserId: string): ProjectFilters {
  const tab = parseProjectTab(searchParams.tab)
  return {
    status: tab === 'active' ? 'Active' : searchParams.status || undefined,
    priority: searchParams.priority || undefined,
    ownerId: searchParams.owner || undefined,
    unitId: searchParams.unit || undefined,
    tagId: searchParams.tag || undefined,
    overdueOnly: tab === 'overdue' || searchParams.overdue === '1',
    includeArchived: searchParams.archived === '1',
    archivedOnly: tab === 'archived',
    mineUserId: tab === 'mine' ? currentUserId : undefined,
    sort: searchParams.sort || undefined,
  }
}

export async function getProjectMemberIds(projectId: string): Promise<string[]> {
  const rows = await db().select({ userId: projectMembers.userId }).from(projectMembers).where(eq(projectMembers.projectId, projectId))
  return rows.map((r) => r.userId)
}
