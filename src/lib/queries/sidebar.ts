import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { projects, tasks } from '@/lib/db/schema'

export async function getSidebarCounts(userId: string) {
  const [[projectRow], [taskRow]] = await Promise.all([
    db()
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.isArchived, false)),
    db()
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(eq(tasks.assigneeId, userId), sql`${tasks.status} not in ('Completed', 'Cancelled')`)),
  ])

  return {
    projectCount: projectRow?.count ?? 0,
    myOpenTaskCount: taskRow?.count ?? 0,
  }
}
