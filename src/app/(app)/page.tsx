import Link from 'next/link'
import { eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits, tags, users } from '@/lib/db/schema'
import { getFilteredProjects, parseProjectFilters } from '@/lib/queries/projects'
import { isOverdue } from '@/lib/permissions'
import { formatDate } from '@/lib/format'
import { OverdueBadge, PriorityBadge, ProjectStatusBadge } from '@/components/Badge'

import { ProjectFilterBar } from './ProjectFilterBar'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireUser()
  const sp = await searchParams
  const filters = parseProjectFilters(sp)

  const [projectRows, owners, units, allTags] = await Promise.all([
    getFilteredProjects(filters),
    db().select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users).orderBy(users.firstName),
    db().select().from(organizationalUnits).where(eq(organizationalUnits.isActive, true)).orderBy(organizationalUnits.name),
    db().select().from(tags).where(eq(tags.isActive, true)).orderBy(tags.name),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Progetti</h1>
        <Link href="/projects/new" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
          + Nuovo progetto
        </Link>
      </div>

      <ProjectFilterBar
        owners={owners.map((o) => ({ id: o.id, label: `${o.firstName} ${o.lastName}` }))}
        units={units.map((u) => ({ id: u.id, label: `${u.code} — ${u.name}` }))}
        tags={allTags.map((t) => ({ id: t.id, label: t.name }))}
        current={sp}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Progetto</th>
              <th className="px-4 py-2">Stato</th>
              <th className="px-4 py-2">Priorità</th>
              <th className="px-4 py-2">Richiedente</th>
              <th className="px-4 py-2">Unità</th>
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">Scadenza</th>
              <th className="px-4 py-2">Avanzamento</th>
            </tr>
          </thead>
          <tbody>
            {projectRows.map((p) => {
              const overdue = isOverdue(p.dueDate, p.status)
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/projects/${p.id}`} className="flex items-center gap-2 font-medium text-slate-900 hover:underline">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                      {p.isArchived && <span className="text-xs font-normal text-slate-400">(archiviato)</span>}
                    </Link>
                    <span className="text-xs text-slate-400">{p.code}</span>
                  </td>
                  <td className="px-4 py-2">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-2">
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.requesterName}</td>
                  <td className="px-4 py-2 text-slate-600">{p.unitName}</td>
                  <td className="px-4 py-2 text-slate-600">{p.ownerName}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {formatDate(p.dueDate)}
                      {overdue && <OverdueBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {p.progressPercent}%{' '}
                    <span className="text-xs text-slate-400">
                      ({p.progressUpdatedAt ? formatDate(p.progressUpdatedAt) : '—'})
                    </span>
                  </td>
                </tr>
              )
            })}
            {projectRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Nessun progetto corrisponde ai filtri.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
