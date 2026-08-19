import { and, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits, projects, projectTags, tags, tasks, users } from '@/lib/db/schema'
import { ProjectStatusBadge } from '@/components/Badge'

export default async function DashboardPage() {
  await requireUser()

  // Snapshot of current, non-archived work — open question §8.8 resolved in
  // favor of "current state", no historical window.
  const activeProjects = eq(projects.isArchived, false)

  const [byStatus, overdueRows, byUnit, byTag, openTasksByUser] = await Promise.all([
    db()
      .select({ status: projects.status, count: sql<number>`count(*)::int` })
      .from(projects)
      .where(activeProjects)
      .groupBy(projects.status),
    db()
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(
        and(
          activeProjects,
          isNotNull(projects.dueDate),
          lt(projects.dueDate, sql`current_date`),
          sql`${projects.status} not in ('Completed', 'Cancelled')`,
        ),
      ),
    db()
      .select({ unitName: organizationalUnits.name, count: sql<number>`count(*)::int` })
      .from(projects)
      .innerJoin(organizationalUnits, eq(projects.requesterUnitId, organizationalUnits.id))
      .where(activeProjects)
      .groupBy(organizationalUnits.name)
      .orderBy(sql`count(*) desc`),
    db()
      .select({ tagName: tags.name, tagColor: tags.color, count: sql<number>`count(*)::int` })
      .from(projectTags)
      .innerJoin(tags, eq(projectTags.tagId, tags.id))
      .innerJoin(projects, eq(projectTags.projectId, projects.id))
      .where(activeProjects)
      .groupBy(tags.name, tags.color)
      .orderBy(sql`count(*) desc`),
    db()
      .select({ firstName: users.firstName, lastName: users.lastName, count: sql<number>`count(*)::int` })
      .from(tasks)
      .innerJoin(users, eq(tasks.assigneeId, users.id))
      .where(inArray(tasks.status, ['Todo', 'InProgress', 'Waiting']))
      .groupBy(users.id, users.firstName, users.lastName)
      .orderBy(sql`count(*) desc`),
  ])

  const totalProjects = byStatus.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-400">Progetti attivi (non archiviati)</p>
          <p className="text-2xl font-semibold text-slate-900">{totalProjects}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-400">Progetti in ritardo</p>
          <p className="text-2xl font-semibold text-rose-600">{overdueRows[0]?.count ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Progetti per stato</h2>
          <div className="flex flex-col gap-2">
            {byStatus.map((r) => (
              <div key={r.status} className="flex items-center justify-between text-sm">
                <ProjectStatusBadge status={r.status} />
                <span className="font-medium text-slate-700">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Progetti per unità richiedente</h2>
          <div className="flex flex-col gap-2">
            {byUnit.map((r) => (
              <div key={r.unitName} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{r.unitName}</span>
                <span className="font-medium text-slate-700">{r.count}</span>
              </div>
            ))}
            {byUnit.length === 0 && <p className="text-sm text-slate-400">Nessun dato.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Progetti per tag</h2>
          <div className="flex flex-col gap-2">
            {byTag.map((r) => (
              <div key={r.tagName} className="flex items-center justify-between text-sm">
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${r.tagColor}22`, color: r.tagColor }}>
                  {r.tagName}
                </span>
                <span className="font-medium text-slate-700">{r.count}</span>
              </div>
            ))}
            {byTag.length === 0 && <p className="text-sm text-slate-400">Nessun dato.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Task aperti per utente</h2>
          <div className="flex flex-col gap-2">
            {openTasksByUser.map((r) => (
              <div key={`${r.firstName}-${r.lastName}`} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {r.firstName} {r.lastName}
                </span>
                <span className="font-medium text-slate-700">{r.count}</span>
              </div>
            ))}
            {openTasksByUser.length === 0 && <p className="text-sm text-slate-400">Nessun dato.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
