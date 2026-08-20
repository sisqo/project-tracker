import { eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits } from '@/lib/db/schema'
import { formatDate } from '@/lib/format'
import { getDashboardData } from '@/lib/queries/dashboard'
import { Avatar } from '@/components/Avatar'
import { ProgressBar } from '@/components/ProgressBar'

import { DashboardUnitFilter } from './DashboardUnitFilter'

const STATUS_META: Record<string, { label: string; bar: string; dot: string }> = {
  Draft: { label: 'Bozza', bar: 'bg-pt-ghost', dot: 'bg-pt-ghost' },
  Active: { label: 'Attivo', bar: 'bg-pt-good', dot: 'bg-pt-good' },
  OnHold: { label: 'In pausa', bar: 'bg-pt-warn', dot: 'bg-pt-warn' },
  Completed: { label: 'Completato', bar: 'bg-pt-info', dot: 'bg-pt-info' },
  Cancelled: { label: 'Annullato', bar: 'bg-pt-danger', dot: 'bg-pt-danger' },
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ unit?: string }> }) {
  await requireUser()
  const { unit: unitId } = await searchParams

  const [data, units] = await Promise.all([
    getDashboardData(unitId || undefined),
    db().select().from(organizationalUnits).where(eq(organizationalUnits.isActive, true)).orderBy(organizationalUnits.name),
  ])

  const activeCount = data.byStatus.find((r) => r.status === 'Active')?.count ?? 0
  const draftCount = data.byStatus.find((r) => r.status === 'Draft')?.count ?? 0
  const maxUnitCount = Math.max(1, ...data.byUnit.map((r) => r.count))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-pt-ink">Dashboard</h1>
          <p className="mt-1 text-[13px] text-pt-faint">Stato corrente, progetti non archiviati</p>
        </div>
        <DashboardUnitFilter units={units} current={unitId} />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Progetti attivi" value={data.totalProjects} sub={`${activeCount} in corso · ${draftCount} in bozza`} />
        <StatCard label="In ritardo" value={data.overdueCount} tone="danger" sub={data.avgDaysOverdue !== null ? `Media ${data.avgDaysOverdue} giorni oltre scadenza` : 'Nessun progetto in ritardo'} />
        <StatCard label="Task aperti" value={data.openTaskCount} sub={`su ${data.assigneeCount} persone`} />
        <div className="rounded-md border border-pt-line bg-pt-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pt-subtle">Avanzamento medio</div>
          <div className="mt-1.5 font-serif text-[38px] leading-[1.1] text-pt-ink">{data.avgProgress ?? 0}%</div>
          <ProgressBar percent={data.avgProgress ?? 0} className="mt-2" />
        </div>
      </div>

      <div className="rounded-md border border-pt-line bg-pt-surface p-[18px]">
        <h2 className="mb-3.5 font-serif text-[19px] font-medium text-pt-ink">Progetti per stato</h2>
        <div className="flex h-3 gap-0.5 overflow-hidden rounded">
          {data.byStatus.map((r) => (
            <div key={r.status} className={STATUS_META[r.status]?.bar ?? 'bg-pt-ghost'} style={{ width: `${(r.count / Math.max(1, data.totalProjects)) * 100}%` }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-5 text-[13px] text-pt-soft">
          {data.byStatus.map((r) => (
            <span key={r.status} className="inline-flex items-center gap-1.5">
              <span className={`h-[9px] w-[9px] rounded-[2px] ${STATUS_META[r.status]?.dot ?? 'bg-pt-ghost'}`} />
              {STATUS_META[r.status]?.label ?? r.status} <span className="font-mono text-pt-ink">{r.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="rounded-md border border-pt-line bg-pt-surface p-[18px]">
          <h2 className="mb-3.5 font-serif text-[19px] font-medium text-pt-ink">Per unità richiedente</h2>
          <div className="flex flex-col gap-2.5">
            {data.byUnit.map((r) => (
              <div key={r.unitId}>
                <div className="mb-1 flex justify-between text-[13px] text-pt-soft">
                  <span>{r.unitName}</span>
                  <span className="font-mono">{r.count}</span>
                </div>
                <ProgressBar percent={(r.count / maxUnitCount) * 100} />
              </div>
            ))}
            {data.byUnit.length === 0 && <p className="text-sm text-pt-ghost">Nessun dato.</p>}
          </div>
        </div>

        <div className="rounded-md border border-pt-line bg-pt-surface p-[18px]">
          <h2 className="mb-3.5 font-serif text-[19px] font-medium text-pt-ink">Carico per persona</h2>
          <div className="flex flex-col gap-3.5">
            {data.perPerson.map((r) => {
              const total = r.openCount
              const overduePct = total > 0 ? (r.overdueCount / total) * 100 : 0
              return (
                <div key={r.userId} className="flex items-center gap-2.5">
                  <Avatar id={r.userId} firstName={r.firstName} lastName={r.lastName} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-[13px] text-pt-soft">
                      <span>
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="font-mono">
                        {r.openCount}
                        {r.overdueCount > 0 && ` · ${r.overdueCount} in ritardo`}
                      </span>
                    </div>
                    <div className="flex h-[5px] overflow-hidden rounded-full bg-pt-line">
                      <div className="h-full bg-pt-accent" style={{ width: `${100 - overduePct}%` }} />
                      <div className="h-full bg-pt-overdue" style={{ width: `${overduePct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
            {data.perPerson.length === 0 && <p className="text-sm text-pt-ghost">Nessun dato.</p>}
          </div>
        </div>

        <div className="rounded-md border border-pt-line bg-pt-surface p-[18px]">
          <h2 className="mb-3.5 font-serif text-[19px] font-medium text-pt-ink">Scadenze in arrivo</h2>
          <div className="flex flex-col gap-3">
            {data.deadlines.map((d) => (
              <div key={`${d.kind}-${d.id}`} className="flex items-center gap-2.5">
                <span className={`w-[52px] font-mono text-xs ${d.deltaDays < 0 ? 'text-pt-overdue' : 'text-pt-soft'}`}>{formatDate(d.dueDate)}</span>
                <span className="flex-1 truncate text-[13px] text-pt-ink">{d.label}</span>
                <span className={`text-[11.5px] ${d.deltaDays < 0 ? 'text-pt-overdue' : 'text-pt-faint'}`}>
                  {d.deltaDays < 0 ? `${Math.abs(d.deltaDays)} gg` : `${d.deltaDays} gg`}
                </span>
              </div>
            ))}
            {data.deadlines.length === 0 && <p className="text-sm text-pt-ghost">Nessuna scadenza in arrivo.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, tone }: { label: string; value: number; sub: string; tone?: 'danger' }) {
  return (
    <div className={`rounded-md border p-4 ${tone === 'danger' ? 'border-pt-dangerSoft bg-pt-surface' : 'border-pt-line bg-pt-surface'}`}>
      <div className={`font-mono text-[10px] uppercase tracking-[0.12em] ${tone === 'danger' ? 'text-pt-danger' : 'text-pt-subtle'}`}>{label}</div>
      <div className={`mt-1.5 font-serif text-[38px] leading-[1.1] ${tone === 'danger' ? 'text-pt-overdue' : 'text-pt-ink'}`}>{value}</div>
      <div className={`text-[12.5px] ${tone === 'danger' ? 'text-pt-danger' : 'text-pt-faint'}`}>{sub}</div>
    </div>
  )
}
