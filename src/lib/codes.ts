import { sql } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'

/**
 * Next progressive project code for the given year, "YYYY-NNN" (e.g.
 * "2026-014") — open question #1, resolved in favor of a human-readable
 * identifier to cite in communications with the requester.
 *
 * Counts existing codes for the year rather than keeping a separate counter
 * table: volumes are low (§8.10) and a project is never deleted, only
 * archived, so the count never goes backwards.
 */
export async function nextProjectCode(year: number): Promise<string> {
  const prefix = `${year}-`
  const [row] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(sql`${projects.code} like ${prefix + '%'}`)

  const next = (row?.count ?? 0) + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
