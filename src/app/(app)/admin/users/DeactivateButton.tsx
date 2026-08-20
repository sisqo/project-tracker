'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { deactivateUserAction, reactivateUserAction } from './actions'

export function DeactivateButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (!isActive) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => reactivateUserAction(userId))}
        className="block w-full px-3 py-1.5 text-left text-sm text-pt-good hover:bg-pt-shell disabled:opacity-60"
      >
        Riattiva
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deactivateUserAction(userId)
          if (result.error) router.push(`/admin/users/${userId}/deactivate`)
        })
      }
      className="block w-full px-3 py-1.5 text-left text-sm text-pt-danger hover:bg-pt-shell disabled:opacity-60"
    >
      Disattiva
    </button>
  )
}
