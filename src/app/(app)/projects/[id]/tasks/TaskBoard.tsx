import Link from 'next/link'

import { formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/permissions'
import type { ProjectTaskRow } from '@/lib/queries/tasks'
import { TASK_STATUSES } from '@/lib/queries/tasks'
import { OverdueBadge, PriorityBadge } from '@/components/Badge'

import { TaskReorderButtons, TaskStatusSelect } from './TaskControls'

const COLUMN_LABELS: Record<string, string> = {
  Todo: 'Da fare',
  InProgress: 'In corso',
  Waiting: 'In attesa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

export function TaskBoard({ projectId, tasks, canOperate }: { projectId: string; tasks: ProjectTaskRow[]; canOperate: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        return (
          <div key={status} className="min-w-[220px] rounded-lg bg-slate-100 p-2">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-slate-500">
              {COLUMN_LABELS[status]} <span className="text-slate-400">({columnTasks.length})</span>
            </h3>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status)
                return (
                  <div key={task.id} className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex items-start justify-between gap-1">
                      <Link href={`/projects/${projectId}/tasks/${task.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                        {task.title}
                      </Link>
                      {canOperate && <TaskReorderButtons projectId={projectId} taskId={task.id} />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <PriorityBadge priority={task.priority} />
                      {overdue && <OverdueBadge />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.assigneeFirstName ? `${task.assigneeFirstName} ${task.assigneeLastName}` : 'Non assegnato'}
                    </p>
                    {task.dueDate && <p className="text-xs text-slate-400">Scadenza: {formatDate(task.dueDate)}</p>}
                    {canOperate && (
                      <div className="mt-2">
                        <TaskStatusSelect projectId={projectId} taskId={task.id} status={task.status} />
                      </div>
                    )}
                  </div>
                )
              })}
              {columnTasks.length === 0 && <p className="px-1 text-xs text-slate-400">Nessun task.</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
