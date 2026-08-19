'use client'

import { useTransition } from 'react'

import { addTagAction, removeTagAction } from './actions'

type Tag = { id: string; name: string; color: string }

export function TagManager({
  projectId,
  current,
  available,
}: {
  projectId: string
  current: Tag[]
  available: Tag[]
}) {
  const [pending, startTransition] = useTransition()
  const currentIds = new Set(current.map((t) => t.id))
  const options = available.filter((t) => !currentIds.has(t.id))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {current.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${t.color}22`, color: t.color }}
        >
          {t.name}
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => removeTagAction(projectId, t.id))}
            className="ml-0.5 hover:opacity-70"
            aria-label={`Rimuovi tag ${t.name}`}
          >
            ×
          </button>
        </span>
      ))}
      {options.length > 0 && (
        <select
          disabled={pending}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) startTransition(() => addTagAction(projectId, e.target.value))
            e.target.value = ''
          }}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="" disabled>
            + aggiungi tag
          </option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
