'use client'

import { useActionState } from 'react'

import { loginAction } from './actions'

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-pt-soft">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          className="rounded-md border border-pt-lineStrong px-3 py-2 text-sm focus:border-pt-accent focus:outline-none focus:ring-1 focus:ring-pt-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-pt-soft">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-md border border-pt-lineStrong px-3 py-2 text-sm focus:border-pt-accent focus:outline-none focus:ring-1 focus:ring-pt-accent"
        />
      </div>
      {state?.error && <p className="text-sm text-pt-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-pt-accent px-4 py-2 text-sm font-medium text-white hover:bg-pt-accentDark disabled:opacity-60"
      >
        {pending ? 'Accesso in corso…' : 'Accedi'}
      </button>
    </form>
  )
}
