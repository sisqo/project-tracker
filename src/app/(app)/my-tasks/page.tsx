import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { projects, tasks } from '@/lib/db/schema'
import { formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/permissions'
import { OverdueBadge, PriorityBadge, TaskStatusBadge } from '@/components/Badge'

export default async function MyTasksPage() {
  const user = await requireUser()

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

  const byProject = new Map<string, { name: string; color: string; tasks: typeof sorted }>()
  for (const t of sorted) {
    const entry = byProject.get(t.projectId) ?? { name: t.projectName, color: t.projectColor, tasks: [] }
    entry.tasks.push(t)
    byProject.set(t.projectId, entry)
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">I miei task</h1>
      {byProject.size === 0 && <p className="text-sm text-slate-500">Nessun task assegnato.</p>}
      <div className="flex flex-col gap-6">
        {[...byProject.entries()].map(([projectId, group]) => (
          <div key={projectId}>
            <Link href={`/projects/${projectId}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 hover:underline">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
              {group.name}
            </Link>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <tbody>
                  {group.tasks.map((t) => {
                    const overdue = isOverdue(t.dueDate, t.status)
                    return (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline">
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <TaskStatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-2">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {formatDate(t.dueDate)}
                            {overdue && <OverdueBadge />}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
