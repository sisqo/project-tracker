import { eq, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { db } from '@/lib/db/client'
import { organizationalUnits, projects, requesters, tasks, users } from '@/lib/db/schema'

const ownerAlias = alias(users, 'owner_user')

export type SearchResults = {
  projects: { id: string; name: string; code: string; status: string; ownerFirstName: string; ownerLastName: string }[]
  tasks: { id: string; title: string; projectId: string; projectName: string; status: string }[]
  requesters: { id: string; firstName: string; lastName: string; unitName: string }[]
  units: { id: string; code: string; name: string }[]
}

export async function searchAll(query: string): Promise<SearchResults> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { projects: [], tasks: [], requesters: [], units: [] }
  }
  const like = `%${trimmed}%`

  const [projectResults, taskResults, requesterResults, unitResults] = await Promise.all([
    db()
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        status: projects.status,
        ownerFirstName: ownerAlias.firstName,
        ownerLastName: ownerAlias.lastName,
      })
      .from(projects)
      .innerJoin(ownerAlias, eq(projects.ownerId, ownerAlias.id))
      .where(or(sql`${projects.name} ilike ${like}`, sql`${projects.code} ilike ${like}`))
      .limit(20),
    db()
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId, projectName: projects.name, status: tasks.status })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(sql`${tasks.title} ilike ${like}`)
      .limit(20),
    db()
      .select({
        id: requesters.id,
        firstName: requesters.firstName,
        lastName: requesters.lastName,
        unitName: organizationalUnits.name,
      })
      .from(requesters)
      .innerJoin(organizationalUnits, eq(requesters.unitId, organizationalUnits.id))
      .where(or(sql`${requesters.firstName} ilike ${like}`, sql`${requesters.lastName} ilike ${like}`, sql`${requesters.email} ilike ${like}`))
      .limit(20),
    db()
      .select()
      .from(organizationalUnits)
      .where(or(sql`${organizationalUnits.name} ilike ${like}`, sql`${organizationalUnits.code} ilike ${like}`))
      .limit(20),
  ])

  return { projects: projectResults, tasks: taskResults, requesters: requesterResults, units: unitResults }
}
