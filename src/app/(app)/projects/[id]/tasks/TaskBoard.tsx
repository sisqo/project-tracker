import Link from 'next/link'

import { Avatar, UnassignedAvatar } from '@/components/Avatar'
import { formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/permissions'
import type { ProjectTaskRow } from '@/lib/queries/tasks'
import { TASK_STATUSES } from '@/lib/queries/tasks'

import { TaskReorderButtons, TaskStatusSelect } from './TaskControls'

const COLUMN_LABELS: Record<string, string> = {
  Todo: 'Da fare',
  InProgress: 'In corso',
  Waiting: 'In attesa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

export function TaskBoard({ projectId, tasks, canOperate }: { projectId: string; tasks: ProjectTaskRow[]; canOperate: boolean }) {
  const visibleStatuses = TASK_STATUSES.filter((s) => s !== 'Cancelled')
  const cancelledCount = tasks.filter((t) => t.status === 'Cancelled').length

  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
      {visibleStatuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        return (
          <div key={status} className="min-w-[220px] rounded-md border border-pt-line bg-pt-shell p-2.5">
            <div className="flex items-center justify-between px-0.5 pb-2.5">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-pt-muted">
                {COLUMN_LABELS[status]} · {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status)
                const done = task.status === 'Completed'
                return (
                  <div
                    key={task.id}
                    className={`rounded-[5px] border bg-pt-surface p-3 ${overdue ? 'border-[#e0c9d6] shadow-[0_1px_3px_rgba(124,45,94,0.08)]' : 'border-pt-line'} ${done ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link href={`/projects/${projectId}/tasks/${task.id}`} className="text-[13.5px] font-medium leading-snug text-pt-ink hover:underline">
                        {task.title}
                      </Link>
                      {canOperate && <TaskReorderButtons projectId={projectId} taskId={task.id} />}
                    </div>
                    {overdue && (
                      <div className="mt-1.5">
                        <span className="rounded bg-pt-overdue px-1.5 py-0.5 text-[11px] font-medium text-white">In ritardo</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {task.assigneeFirstName && task.assigneeId ? (
                        <Avatar id={task.assigneeId} firstName={task.assigneeFirstName} lastName={task.assigneeLastName ?? ''} size="sm" />
                      ) : (
                        <UnassignedAvatar size="sm" />
                      )}
                      <span className={`font-mono text-[11.5px] ${overdue ? 'text-pt-overdue' : 'text-pt-faint'}`}>
                        {task.dueDate ? formatDate(task.dueDate) : 'Senza scadenza'}
                      </span>
                    </div>
                    {canOperate && (
                      <div className="mt-2">
                        <TaskStatusSelect projectId={projectId} taskId={task.id} status={task.status} />
                      </div>
                    )}
                  </div>
                )
              })}
              {columnTasks.length === 0 && <p className="px-1 text-xs text-pt-ghost">Nessun task.</p>}
              {status === 'Completed' && (
                <p className="px-0.5 pt-0.5 text-[11.5px] text-pt-ghost">Annullati ({cancelledCount}) nascosti</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
