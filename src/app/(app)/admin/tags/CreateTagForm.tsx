'use client'

import { useActionState } from 'react'

import { createTagAction } from './actions'

export function CreateTagForm() {
  const [state, formAction, pending] = useActionState(createTagAction, undefined)

  return (
    <form action={formAction} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-pt-line bg-pt-surface p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pt-muted">Nome</label>
        <input name="name" required className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pt-muted">Colore</label>
        <input name="color" type="color" defaultValue="#6366f1" className="h-8 w-14 rounded border border-pt-lineStrong" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pt-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-pt-accentDark disabled:opacity-60"
      >
        {pending ? 'Creazione…' : 'Crea tag'}
      </button>
      {state?.error && <p className="w-full text-sm text-pt-danger">{state.error}</p>}
    </form>
  )
}
