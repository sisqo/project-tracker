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
        className="text-emerald-600 hover:text-emerald-800 disabled:opacity-60"
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
      className="text-rose-600 hover:text-rose-800 disabled:opacity-60"
    >
      Disattiva
    </button>
  )
}
