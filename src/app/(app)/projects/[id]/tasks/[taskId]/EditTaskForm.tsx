'use client'

import { useActionState } from 'react'

import { updateTaskAction, type FormState } from './actions'

type Task = {
  title: string
  description: string | null
  priority: string
  dueDate: string | null
  estimatedHours: string | null
  assigneeId: string | null
}

type Option = { id: string; name: string }

export function EditTaskForm({
  projectId,
  taskId,
  task,
  assigneeOptions,
  disabled,
}: {
  projectId: string
  taskId: string
  task: Task
  assigneeOptions: Option[]
  disabled: boolean
}) {
  const action = updateTaskAction.bind(null, projectId, taskId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Titolo</label>
        <input name="title" defaultValue={task.title} disabled={disabled} required className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Descrizione</label>
        <textarea name="description" defaultValue={task.description ?? ''} disabled={disabled} rows={3} className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Priorità</label>
          <select name="priority" defaultValue={task.priority} disabled={disabled} className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50">
            <option value="High">Alta</option>
            <option value="Medium">Media</option>
            <option value="Low">Bassa</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Assegnatario</label>
          <select name="assigneeId" defaultValue={task.assigneeId ?? ''} disabled={disabled} className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50">
            <option value="">Non assegnato</option>
            {assigneeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Scadenza</label>
          <input name="dueDate" type="date" defaultValue={task.dueDate ?? ''} disabled={disabled} className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Ore stimate</label>
          <input name="estimatedHours" type="number" min={0} step="0.5" defaultValue={task.estimatedHours ?? ''} disabled={disabled} className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {!disabled && (
        <button type="submit" disabled={pending} className="self-start rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
          {pending ? 'Salvataggio…' : 'Salva'}
        </button>
      )}
    </form>
  )
}
