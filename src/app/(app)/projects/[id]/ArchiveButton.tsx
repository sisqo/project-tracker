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
      className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {isArchived ? 'Ripristina dagli archivi' : 'Archivia progetto'}
    </button>
  )
}
