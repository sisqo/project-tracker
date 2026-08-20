'use client'

import { useState, useTransition } from 'react'

import { ProjectStatusBadge } from '@/components/Badge'

import { updateStatusAction } from './actions'

const STATUSES = [
  { value: 'Draft', label: 'Bozza' },
  { value: 'Active', label: 'Attivo' },
  { value: 'OnHold', label: 'In pausa' },
  { value: 'Completed', label: 'Completato' },
  { value: 'Cancelled', label: 'Annullato' },
]

export function StatusForm({ projectId, status, completionDate }: { projectId: string; status: string; completionDate: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(status)
  const [date, setDate] = useState(completionDate ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(confirmed: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await updateStatusAction(projectId, value, value === 'Completed' ? date : null, confirmed)
      if (result.error) {
        setError(result.error)
      } else if (result.openTaskCount) {
        if (window.confirm(`Il progetto ha ancora ${result.openTaskCount} task aperti. Completare comunque?`)) {
          submit(true)
        }
      } else {
        setEditing(false)
      }
    })
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5">
        <ProjectStatusBadge status={value} />
        <span className="text-xs text-pt-accent hover:text-pt-accentDark">Cambia</span>
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={value} onChange={(e) => setValue(e.target.value)} className="rounded border border-pt-lineStrong px-2 py-1 text-sm">
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {value === 'Completed' && (
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-pt-lineStrong px-2 py-1 text-sm" />
      )}
      <button
        type="button"
        disabled={pending || value === status}
        onClick={() => submit(false)}
        className="rounded-md bg-pt-ink px-3 py-1 text-sm text-white hover:bg-pt-soft disabled:opacity-50"
      >
        Aggiorna
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-sm text-pt-subtle hover:text-pt-ink">
        Annulla
      </button>
      {error && <span className="text-sm text-pt-danger">{error}</span>}
    </div>
  )
}
