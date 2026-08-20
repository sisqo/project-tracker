'use client'

import { useActionState } from 'react'

import { setPasswordAction } from './actions'

export function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(setPasswordAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-pt-soft">
          Nuova password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoFocus
          className="rounded-md border border-pt-lineStrong px-3 py-2 text-sm focus:border-pt-accent focus:outline-none focus:ring-1 focus:ring-pt-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-pt-soft">
          Conferma password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-pt-lineStrong px-3 py-2 text-sm focus:border-pt-accent focus:outline-none focus:ring-1 focus:ring-pt-accent"
        />
      </div>
      {state?.error && <p className="text-sm text-pt-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-pt-accent px-4 py-2 text-sm font-medium text-white hover:bg-pt-accentDark disabled:opacity-60"
      >
        {pending ? 'Salvataggio…' : 'Imposta password'}
      </button>
    </form>
  )
}
