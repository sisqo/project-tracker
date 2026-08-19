'use client'

import { useActionState } from 'react'

import { createUserAction } from './actions'

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, undefined)

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
        <label className="text-xs font-medium text-slate-600">Ruolo</label>
        <select name="role" defaultValue="User" className="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="User">User</option>
          <option value="Administrator">Administrator</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? 'Creazione…' : 'Crea utente'}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state?.resetLink && (
        <div className="w-full rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Utente creato. Consegna questo link per il primo accesso:
          <input
            readOnly
            value={state.resetLink}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 block w-full rounded border border-emerald-300 bg-white px-2 py-1 text-xs"
          />
        </div>
      )}
    </form>
  )
}
