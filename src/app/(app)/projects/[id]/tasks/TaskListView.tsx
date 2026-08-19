import Link from 'next/link'

import { formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/permissions'
import type { ProjectTaskRow } from '@/lib/queries/tasks'
import { OverdueBadge, PriorityBadge, TaskStatusBadge } from '@/components/Badge'

import { TaskReorderButtons, TaskStatusSelect } from './TaskControls'

export function TaskListView({ projectId, tasks, canOperate }: { projectId: string; tasks: ProjectTaskRow[]; canOperate: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {canOperate && <th className="px-2 py-2" />}
            <th className="px-4 py-2">Task</th>
            <th className="px-4 py-2">Stato</th>
            <th className="px-4 py-2">Priorità</th>
            <th className="px-4 py-2">Assegnatario</th>
            <th className="px-4 py-2">Scadenza</th>
            <th className="px-4 py-2">Ore stimate</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status)
            return (
              <tr key={task.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {canOperate && (
                  <td className="px-2 py-2">
                    <TaskReorderButtons projectId={projectId} taskId={task.id} />
                  </td>
                )}
                <td className="px-4 py-2">
                  <Link href={`/projects/${projectId}/tasks/${task.id}`} className="font-medium text-slate-900 hover:underline">
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-2">{canOperate ? <TaskStatusSelect projectId={projectId} taskId={task.id} status={task.status} /> : <TaskStatusBadge status={task.status} />}</td>
                <td className="px-4 py-2">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {task.assigneeFirstName ? `${task.assigneeFirstName} ${task.assigneeLastName}` : '—'}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {formatDate(task.dueDate)}
                    {overdue && <OverdueBadge />}
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-600">{task.estimatedHours ?? '—'}</td>
              </tr>
            )
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                Nessun task.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
