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
      className={isActive ? 'text-pt-danger hover:text-pt-overdue disabled:opacity-60' : 'text-pt-good hover:text-pt-good disabled:opacity-60'}
    >
      {isActive ? 'Disattiva' : 'Riattiva'}
    </button>
  )
}
