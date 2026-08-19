import Link from 'next/link'

import type { ProjectTaskRow } from '@/lib/queries/tasks'

import { TaskBoard } from './TaskBoard'
import { TaskCreateForm } from './TaskCreateForm'
import { TaskListView } from './TaskListView'

type Option = { id: string; name: string }

export function TaskSection({
  projectId,
  tasks,
  view,
  canOperate,
  assigneeOptions,
}: {
  projectId: string
  tasks: ProjectTaskRow[]
  view: 'board' | 'list'
  canOperate: boolean
  assigneeOptions: Option[]
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Task</h2>
        <div className="flex items-center gap-2 text-xs">
          <a href={`/projects/${projectId}/tasks/export`} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">
            Esporta CSV
          </a>
          <Link
            href={`/projects/${projectId}?view=board`}
            className={`rounded px-2 py-1 ${view === 'board' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Board
          </Link>
          <Link
            href={`/projects/${projectId}?view=list`}
            className={`rounded px-2 py-1 ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Lista
          </Link>
        </div>
      </div>
      {canOperate && <TaskCreateForm projectId={projectId} assigneeOptions={assigneeOptions} />}
      {view === 'board' ? (
        <TaskBoard projectId={projectId} tasks={tasks} canOperate={canOperate} />
      ) : (
        <TaskListView projectId={projectId} tasks={tasks} canOperate={canOperate} />
      )}
    </section>
  )
}
