import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { projects, tasks } from '@/lib/db/schema'
import { formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/permissions'
import { PriorityBadge } from '@/components/Badge'

import { TaskQuickToggle } from './TaskQuickToggle'

type Row = {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  projectId: string
  projectName: string
  projectColor: string
}

export default async function MyTasksPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const user = await requireUser()
  const { group } = await searchParams
  const groupByProject = group === 'project'

  const rows = await db()
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectColor: projects.color,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.assigneeId, user.id))
    .orderBy(asc(tasks.dueDate))

  const sorted = [...rows].sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 } as Record<string, number>
    if (!a.dueDate && b.dueDate) return 1
    if (a.dueDate && !b.dueDate) return -1
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const openTasks = sorted.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
  const overdueCount = openTasks.filter((t) => isOverdue(t.dueDate, t.status)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-medium text-pt-ink">I miei task</h1>
          <p className="mt-1 text-[13px] text-pt-faint">
            {openTasks.length} aperti · {overdueCount} in ritardo
          </p>
        </div>
        <div className="flex rounded-md bg-pt-shell p-0.5">
          <Link href="/my-tasks" className={`rounded px-2.5 py-[5px] text-[12.5px] ${!groupByProject ? 'bg-pt-surface font-medium text-pt-ink shadow-sm' : 'text-pt-muted'}`}>
            Per scadenza
          </Link>
          <Link href="/my-tasks?group=project" className={`rounded px-2.5 py-[5px] text-[12.5px] ${groupByProject ? 'bg-pt-surface font-medium text-pt-ink shadow-sm' : 'text-pt-muted'}`}>
            Per progetto
          </Link>
        </div>
      </div>

      {sorted.length === 0 && <p className="text-sm text-pt-faint">Nessun task assegnato.</p>}

      {groupByProject ? <ByProject rows={sorted} /> : <ByUrgency rows={sorted} /> }
    </div>
  )
}

function ByUrgency({ rows }: { rows: Row[] }) {
  const today = new Date(new Date().toDateString())
  const weekAhead = new Date(today.getTime() + 6 * 86400000)

  const overdue: Row[] = []
  const thisWeek: Row[] = []
  const later: Row[] = []

  for (const t of rows) {
    if (t.status === 'Completed' || t.status === 'Cancelled') {
      later.push(t)
      continue
    }
    if (isOverdue(t.dueDate, t.status)) {
      overdue.push(t)
    } else if (t.dueDate && new Date(t.dueDate) <= weekAhead) {
      thisWeek.push(t)
    } else {
      later.push(t)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <TaskGroup label="In ritardo" rows={overdue} tone="danger" />
      <TaskGroup label="Questa settimana" rows={thisWeek} />
      <TaskGroup label="Più avanti" rows={later} />
    </div>
  )
}

function ByProject({ rows }: { rows: Row[] }) {
  const byProject = new Map<string, { name: string; color: string; tasks: Row[] }>()
  for (const t of rows) {
    const entry = byProject.get(t.projectId) ?? { name: t.projectName, color: t.projectColor, tasks: [] }
    entry.tasks.push(t)
    byProject.set(t.projectId, entry)
  }

  return (
    <div className="flex flex-col gap-6">
      {[...byProject.entries()].map(([projectId, group]) => (
        <div key={projectId}>
          <Link href={`/projects/${projectId}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-pt-ink hover:underline">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            {group.name}
          </Link>
          <TaskRows rows={group.tasks} />
        </div>
      ))}
    </div>
  )
}

function TaskGroup({ label, rows, tone }: { label: string; rows: Row[]; tone?: 'danger' }) {
  if (rows.length === 0) return null
  return (
    <div className="mb-1">
      <div className={`mb-2 mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] ${tone === 'danger' ? 'text-pt-overdue' : 'text-pt-faint'}`}>
        {label} · {rows.length}
      </div>
      <TaskRows rows={rows} tone={tone} />
    </div>
  )
}

function TaskRows({ rows, tone }: { rows: Row[]; tone?: 'danger' }) {
  return (
    <div className={`overflow-hidden rounded-md border bg-pt-surface ${tone === 'danger' ? 'border-pt-dangerSoft' : 'border-pt-line'}`}>
      {rows.map((t) => {
        const overdue = isOverdue(t.dueDate, t.status)
        const daysDelta = t.dueDate ? Math.round((new Date(t.dueDate).getTime() - Date.now()) / 86400000) : null
        return (
          <div key={t.id} className="flex items-center gap-3 border-b border-pt-line/70 px-3.5 py-[11px] last:border-0">
            <TaskQuickToggle projectId={t.projectId} taskId={t.id} status={t.status} />
            <div className="min-w-0 flex-1">
              <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="block truncate text-[13.5px] font-medium text-pt-ink hover:underline">
                {t.title}
              </Link>
              <div className="text-xs text-pt-faint">{t.projectName}</div>
            </div>
            <PriorityBadge priority={t.priority} />
            <span className={`w-16 shrink-0 text-right font-mono text-xs ${overdue ? 'text-pt-overdue' : 'text-pt-soft'}`}>
              {t.dueDate ? formatDate(t.dueDate) : '—'}
              {overdue && daysDelta !== null && ` · ${daysDelta}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
