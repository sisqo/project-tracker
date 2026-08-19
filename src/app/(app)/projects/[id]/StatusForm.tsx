'use client'

import { useState, useTransition } from 'react'

import { updateStatusAction } from './actions'

const STATUSES = [
  { value: 'Draft', label: 'Bozza' },
  { value: 'Active', label: 'Attivo' },
  { value: 'OnHold', label: 'In pausa' },
  { value: 'Completed', label: 'Completato' },
  { value: 'Cancelled', label: 'Annullato' },
]

export function StatusForm({ projectId, status, completionDate }: { projectId: string; status: string; completionDate: string | null }) {
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
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {value === 'Completed' && (
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
      )}
      <button
        type="button"
        disabled={pending || value === status}
        onClick={() => submit(false)}
        className="rounded-md bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Aggiorna stato
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
