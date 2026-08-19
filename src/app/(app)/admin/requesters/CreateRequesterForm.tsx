'use client'

import { useActionState } from 'react'

import { createRequesterAction } from './actions'

export function CreateRequesterForm({ units }: { units: { id: string; code: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createRequesterAction, undefined)

  return (
    <form action={formAction} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Nome</label>
        <input name="firstName" required className="rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Cognome</label>
        <input name="lastName" required className="rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" required className="rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Unità</label>
        <select name="unitId" required className="rounded border border-slate-300 px-2 py-1 text-sm">
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? 'Creazione…' : 'Crea richiedente'}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
