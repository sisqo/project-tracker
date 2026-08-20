'use client'

import { useActionState } from 'react'

import { createProjectAction } from './actions'

type Requester = { id: string; firstName: string; lastName: string; unitName: string }

export function NewProjectForm({ requesters }: { requesters: Requester[] }) {
  const [state, formAction, pending] = useActionState(createProjectAction, undefined)

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4 rounded-lg border border-pt-line bg-pt-surface p-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-pt-soft">Nome progetto</label>
        <input name="name" required className="rounded border border-pt-lineStrong px-3 py-2 text-sm" />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-pt-soft">Colore</label>
          <input name="color" type="color" defaultValue="#6366f1" className="h-9 w-16 rounded border border-pt-lineStrong" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-pt-soft">Priorità</label>
          <select name="priority" defaultValue="Medium" className="rounded border border-pt-lineStrong px-3 py-2 text-sm">
            <option value="High">Alta</option>
            <option value="Medium">Media</option>
            <option value="Low">Bassa</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-pt-soft">Richiedente</label>
        <select name="requesterId" required className="rounded border border-pt-lineStrong px-3 py-2 text-sm">
          {requesters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.firstName} {r.lastName} — {r.unitName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-pt-soft">Descrizione</label>
        <textarea name="description" rows={4} className="rounded border border-pt-lineStrong px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Data richiesta</label>
          <input name="requestDate" type="date" className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Data avvio</label>
          <input name="startDate" type="date" className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-pt-muted">Scadenza</label>
          <input name="dueDate" type="date" className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-pt-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-md bg-pt-accent px-4 py-2 text-sm font-medium text-white hover:bg-pt-accentDark disabled:opacity-60"
      >
        {pending ? 'Creazione…' : 'Crea progetto'}
      </button>
    </form>
  )
}
