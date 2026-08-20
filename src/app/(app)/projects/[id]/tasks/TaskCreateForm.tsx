'use client'

import { useActionState } from 'react'

import { createTaskAction, type FormState } from './actions'

type Option = { id: string; name: string }

export function TaskCreateForm({ projectId, assigneeOptions }: { projectId: string; assigneeOptions: Option[] }) {
  const action = createTaskAction.bind(null, projectId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined)

  return (
    <details className="mb-4 rounded-lg border border-pt-line bg-pt-surface">
      <summary className="cursor-pointer select-none px-4 py-2 text-sm font-medium text-pt-soft">+ Nuovo task</summary>
      <form action={formAction} className="flex flex-wrap items-end gap-3 border-t border-pt-line p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Titolo</label>
          <input name="title" required className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Priorità</label>
          <select name="priority" defaultValue="Medium" className="rounded border border-pt-lineStrong px-2 py-1 text-sm">
            <option value="High">Alta</option>
            <option value="Medium">Media</option>
            <option value="Low">Bassa</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Assegnatario</label>
          <select name="assigneeId" defaultValue="" className="rounded border border-pt-lineStrong px-2 py-1 text-sm">
            <option value="">Non assegnato</option>
            {assigneeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Scadenza</label>
          <input name="dueDate" type="date" className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Ore stimate</label>
          <input name="estimatedHours" type="number" min={0} step="0.5" className="w-20 rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
        <div className="flex w-full flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Descrizione</label>
          <textarea name="description" rows={2} className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
        {state?.error && <p className="text-sm text-pt-danger">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-pt-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-pt-accentDark disabled:opacity-60"
        >
          {pending ? 'Creazione…' : 'Crea task'}
        </button>
      </form>
    </details>
  )
}
