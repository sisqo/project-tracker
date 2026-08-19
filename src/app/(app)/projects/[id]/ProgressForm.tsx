'use client'

import { useState, useTransition } from 'react'

import { updateProgressAction } from './actions'

export function ProgressForm({ projectId, progressPercent }: { projectId: string; progressPercent: number }) {
  const [value, setValue] = useState(progressPercent)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
      />
      <span className="text-sm text-slate-500">%</span>
      <button
        type="button"
        disabled={pending || value === progressPercent}
        onClick={() => startTransition(() => updateProgressAction(projectId, value))}
        className="rounded-md bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Aggiorna
      </button>
    </div>
  )
}
