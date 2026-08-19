import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { db } from '@/lib/db/client'
import { organizationalUnits, projectMembers, projects, projectTags, requesters, tags, users } from '@/lib/db/schema'

export async function getProjectDetail(id: string) {
  const owner = alias(users, 'owner_user')

  const [row] = await db()
    .select({
      project: projects,
      requesterFirstName: requesters.firstName,
      requesterLastName: requesters.lastName,
      requesterEmail: requesters.email,
      unitCode: organizationalUnits.code,
      unitName: organizationalUnits.name,
      ownerId: owner.id,
      ownerFirstName: owner.firstName,
      ownerLastName: owner.lastName,
    })
    .from(projects)
    .innerJoin(requesters, eq(projects.requesterId, requesters.id))
    .innerJoin(organizationalUnits, eq(projects.requesterUnitId, organizationalUnits.id))
    .innerJoin(owner, eq(projects.ownerId, owner.id))
    .where(eq(projects.id, id))
    .limit(1)

  if (!row) return null

  const memberRows = await db()
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, isActive: users.isActive })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, id))

  const tagRows = await db()
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(projectTags)
    .innerJoin(tags, eq(projectTags.tagId, tags.id))
    .where(eq(projectTags.projectId, id))

  return {
    project: row.project,
    requester: {
      firstName: row.requesterFirstName,
      lastName: row.requesterLastName,
      email: row.requesterEmail,
    },
    unit: { code: row.unitCode, name: row.unitName },
    owner: { id: row.ownerId, firstName: row.ownerFirstName, lastName: row.ownerLastName },
    members: memberRows,
    tags: tagRows,
    memberIds: memberRows.map((m) => m.id),
  }
}

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>
