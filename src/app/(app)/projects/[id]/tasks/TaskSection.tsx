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
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex rounded-md bg-pt-shell p-0.5">
          <Link
            href={`/projects/${projectId}?tab=task&view=board`}
            className={`rounded px-3 py-[5px] text-[13px] ${view === 'board' ? 'bg-pt-surface font-medium text-pt-ink shadow-sm' : 'text-pt-muted'}`}
          >
            Board
          </Link>
          <Link
            href={`/projects/${projectId}?tab=task&view=list`}
            className={`rounded px-3 py-[5px] text-[13px] ${view === 'list' ? 'bg-pt-surface font-medium text-pt-ink shadow-sm' : 'text-pt-muted'}`}
          >
            Lista
          </Link>
        </div>
        <a href={`/projects/${projectId}/tasks/export`} className="ml-auto rounded-md border border-pt-lineStrong bg-pt-surface px-3 py-[6px] text-[13px] text-pt-soft hover:bg-pt-shell">
          Esporta CSV
        </a>
      </div>
      {canOperate && <TaskCreateForm projectId={projectId} assigneeOptions={assigneeOptions} />}
      {view === 'board' ? (
        <TaskBoard projectId={projectId} tasks={tasks} canOperate={canOperate} />
      ) : (
        <TaskListView projectId={projectId} tasks={tasks} canOperate={canOperate} />
      )}
    </div>
  )
}
