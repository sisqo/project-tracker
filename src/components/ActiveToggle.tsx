'use client'

import { useTransition } from 'react'

export function ActiveToggle({
  id,
  isActive,
  action,
}: {
  id: string
  isActive: boolean
  action: (id: string, next: boolean) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action(id, !isActive))}
      className={isActive ? 'text-rose-600 hover:text-rose-800 disabled:opacity-60' : 'text-emerald-600 hover:text-emerald-800 disabled:opacity-60'}
    >
      {isActive ? 'Disattiva' : 'Riattiva'}
    </button>
  )
}
