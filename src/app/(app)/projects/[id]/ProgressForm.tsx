'use client'

import { useState, useTransition } from 'react'

import { ProgressBar } from '@/components/ProgressBar'

import { updateProgressAction } from './actions'

export function ProgressForm({ projectId, progressPercent }: { projectId: string; progressPercent: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(progressPercent)
  const [pending, startTransition] = useTransition()

  if (!editing) {
    return (
      <div className="flex min-w-[280px] items-center gap-2.5">
        <span className="text-xs text-pt-faint">Avanzamento</span>
        <ProgressBar percent={progressPercent} className="max-w-[150px]" />
        <span className="font-mono text-[13px] text-pt-ink">{progressPercent}%</span>
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-pt-accent hover:text-pt-accentDark">
          Aggiorna
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-16 rounded border border-pt-lineStrong px-2 py-1 text-sm"
        autoFocus
      />
      <span className="text-sm text-pt-subtle">%</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateProgressAction(projectId, value)
            setEditing(false)
          })
        }
        className="rounded-md bg-pt-ink px-3 py-1 text-sm text-white hover:bg-pt-soft disabled:opacity-50"
      >
        Salva
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-sm text-pt-subtle hover:text-pt-ink">
        Annulla
      </button>
    </div>
  )
}
