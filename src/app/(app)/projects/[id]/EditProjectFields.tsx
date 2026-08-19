'use client'

import { useActionState } from 'react'

import { updateProjectFieldsAction, type FormState } from './actions'

type Project = {
  id: string
  name: string
  color: string
  description: string | null
  priority: string
  requestDate: string | null
  startDate: string | null
  dueDate: string | null
}

export function EditProjectFields({ project }: { project: Project }) {
  const action = updateProjectFieldsAction.bind(null, project.id)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined)

  return (
    <details className="rounded-lg border border-slate-200 bg-white">
      <summary className="cursor-pointer select-none px-4 py-2 text-sm font-medium text-slate-700">
        Modifica dati progetto
      </summary>
      <form action={formAction} className="flex flex-col gap-3 border-t border-slate-100 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Nome</label>
          <input name="name" defaultValue={project.name} required className="rounded border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Colore</label>
            <input name="color" type="color" defaultValue={project.color} className="h-8 w-14 rounded border border-slate-300" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Priorità</label>
            <select name="priority" defaultValue={project.priority} className="rounded border border-slate-300 px-2 py-1 text-sm">
              <option value="High">Alta</option>
              <option value="Medium">Media</option>
              <option value="Low">Bassa</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Descrizione</label>
          <textarea name="description" defaultValue={project.description ?? ''} rows={3} className="rounded border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Data richiesta</label>
            <input name="requestDate" type="date" defaultValue={project.requestDate ?? ''} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Data avvio</label>
            <input name="startDate" type="date" defaultValue={project.startDate ?? ''} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Scadenza</label>
            <input name="dueDate" type="date" defaultValue={project.dueDate ?? ''} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? 'Salvataggio…' : 'Salva'}
        </button>
      </form>
    </details>
  )
}
