'use client'

import { useTransition } from 'react'

import { moveTaskAction, updateTaskStatusAction } from './actions'

const STATUS_LABELS: Record<string, string> = {
  Todo: 'Da fare',
  InProgress: 'In corso',
  Waiting: 'In attesa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

export function TaskReorderButtons({ projectId, taskId }: { projectId: string; taskId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex flex-col leading-none text-slate-400">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => moveTaskAction(projectId, taskId, 'up'))}
        className="hover:text-slate-700 disabled:opacity-40"
        aria-label="Sposta su"
      >
        ▲
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => moveTaskAction(projectId, taskId, 'down'))}
        className="hover:text-slate-700 disabled:opacity-40"
        aria-label="Sposta giù"
      >
        ▼
      </button>
    </div>
  )
}

export function TaskStatusSelect({ projectId, taskId, status }: { projectId: string; taskId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateTaskStatusAction(projectId, taskId, e.target.value))}
      className="rounded border border-slate-300 px-1.5 py-0.5 text-xs disabled:opacity-60"
    >
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
