import Link from 'next/link'
import { eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits, tags, users } from '@/lib/db/schema'
import { getFilteredProjects, getProjectListCounts, parseProjectFilters, parseProjectTab } from '@/lib/queries/projects'
import { isOverdue } from '@/lib/permissions'
import { formatDate } from '@/lib/format'
import { PriorityBadge, ProjectStatusBadge } from '@/components/Badge'
import { ProgressBar } from '@/components/ProgressBar'

import { ProjectFilterBar } from './ProjectFilterBar'

const ROW_GRID = 'grid grid-cols-[minmax(0,2.4fr)_106px_88px_minmax(0,1.4fr)_116px_150px] items-center gap-4'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const tab = parseProjectTab(sp.tab)
  const filters = parseProjectFilters(sp, user.id)

  const [projectRows, counts, owners, units, allTags] = await Promise.all([
    getFilteredProjects(filters),
    getProjectListCounts(filters, user.id),
    db().select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users).orderBy(users.firstName),
    db().select().from(organizationalUnits).where(eq(organizationalUnits.isActive, true)).orderBy(organizationalUnits.name),
    db().select().from(tags).where(eq(tags.isActive, true)).orderBy(tags.name),
  ])

  const overdueCount = projectRows.filter((p) => isOverdue(p.dueDate, p.status)).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-pt-ink">Progetti</h1>
          <p className="mt-1 text-[13px] text-pt-faint">
            {projectRows.length} progetti · {overdueCount} in ritardo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/projects/export?${new URLSearchParams(Object.fromEntries(Object.entries(sp).filter((e): e is [string, string] => !!e[1]))).toString()}`}
            className="rounded-md border border-pt-lineStrong bg-pt-surface px-3 py-[7px] text-[13px] text-pt-soft hover:bg-pt-shell"
          >
            Esporta CSV
          </a>
          <Link href="/projects/new" className="rounded-md bg-pt-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-pt-accentDark">
            Nuovo progetto
          </Link>
        </div>
      </div>

      <ProjectFilterBar
        owners={owners.map((o) => ({ id: o.id, label: `${o.firstName} ${o.lastName}` }))}
        units={units.map((u) => ({ id: u.id, label: `${u.code} — ${u.name}` }))}
        tags={allTags.map((t) => ({ id: t.id, label: t.name }))}
        current={sp}
        tab={tab}
        counts={counts}
      />

      <div className="overflow-hidden rounded-md border border-pt-line bg-pt-surface">
        <div className={`${ROW_GRID} border-b border-pt-line bg-pt-surfaceSoft px-[18px] py-[9px] font-mono text-[10.5px] uppercase tracking-[0.1em] text-pt-faint`}>
          <span>Progetto</span>
          <span>Stato</span>
          <span>Priorità</span>
          <span>Owner · richiedente</span>
          <span>Scadenza</span>
          <span>Avanzamento</span>
        </div>

        {projectRows.map((p) => {
          const overdue = isOverdue(p.dueDate, p.status)
          const daysOverdue = overdue && p.dueDate ? Math.round((Date.now() - new Date(p.dueDate).getTime()) / 86400000) : 0
          const closed = p.status === 'Completed' || p.status === 'Cancelled'

          return (
            <Link key={p.id} href={`/projects/${p.id}`} className={`${ROW_GRID} border-b border-pt-line/70 px-[18px] py-3.5 last:border-0 hover:bg-pt-surfaceSoft`}>
              <div className="flex min-w-0 gap-2.5">
                <span className="w-[3px] shrink-0 self-stretch rounded" style={{ backgroundColor: p.color }} />
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-medium text-pt-ink">
                    {p.name}
                    {p.isArchived && <span className="ml-1.5 text-xs font-normal text-pt-ghost">(archiviato)</span>}
                  </div>
                  <div className="font-mono text-[11.5px] text-pt-subtle">
                    {p.code} · {closed ? `chiuso il ${formatDate(p.completionDate)}` : `${p.openTaskCount} task aperti`}
                  </div>
                </div>
              </div>
              <span className="justify-self-start">
                <ProjectStatusBadge status={p.status} />
              </span>
              <span className="justify-self-start">
                <PriorityBadge priority={p.priority} />
              </span>
              <div className="min-w-0 text-[13px] leading-[1.4] text-pt-soft">
                {p.ownerName}
                <div className="text-xs text-pt-subtle">
                  {p.requesterName} · {p.unitName}
                </div>
              </div>
              {overdue ? (
                <div className="leading-tight">
                  <div className="font-mono text-[12.5px] font-medium text-pt-overdue">{formatDate(p.dueDate)}</div>
                  <div className="text-[11.5px] text-pt-overdue">{daysOverdue} giorni di ritardo</div>
                </div>
              ) : (
                <span className="font-mono text-[12.5px] text-pt-soft">{formatDate(p.dueDate)}</span>
              )}
              <div className="flex items-center gap-2">
                <ProgressBar percent={p.progressPercent} tone={closed ? 'info' : 'accent'} />
                <span className="w-8 text-right font-mono text-xs text-pt-soft">{p.progressPercent}%</span>
              </div>
            </Link>
          )
        })}

        {projectRows.length === 0 && <p className="px-4 py-8 text-center text-sm text-pt-ghost">Nessun progetto corrisponde ai filtri.</p>}
      </div>
    </div>
  )
}
