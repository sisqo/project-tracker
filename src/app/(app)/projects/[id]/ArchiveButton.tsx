'use client'

import { useTransition } from 'react'

import { setArchivedAction } from './actions'

export function ArchiveButton({ projectId, isArchived }: { projectId: string; isArchived: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setArchivedAction(projectId, !isArchived))}
      className="block w-full px-3 py-1.5 text-left text-sm text-pt-soft hover:bg-pt-shell disabled:opacity-60"
    >
      {isArchived ? 'Ripristina dagli archivi' : 'Archivia progetto'}
    </button>
  )
}
