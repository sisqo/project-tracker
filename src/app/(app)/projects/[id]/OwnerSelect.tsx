'use client'

import { useState, useTransition } from 'react'

import { Avatar } from '@/components/Avatar'

import { updateOwnerAction } from './actions'

type Option = { id: string; firstName: string; lastName: string }

export function OwnerSelect({ projectId, ownerId, options }: { projectId: string; ownerId: string; options: Option[] }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const owner = options.find((o) => o.id === ownerId)

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {owner && <Avatar id={owner.id} firstName={owner.firstName} lastName={owner.lastName} />}
        <span className="text-[13.5px] text-pt-ink">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</span>
        <button type="button" onClick={() => setEditing(true)} className="ml-auto text-xs text-pt-accent hover:text-pt-accentDark">
          Cambia
        </button>
      </div>
    )
  }

  return (
    <select
      defaultValue={ownerId}
      disabled={pending}
      autoFocus
      onBlur={() => setEditing(false)}
      onChange={(e) => {
        const value = e.target.value
        startTransition(async () => {
          await updateOwnerAction(projectId, value)
          setEditing(false)
        })
      }}
      className="w-full rounded border border-pt-lineStrong px-2 py-1 text-sm disabled:opacity-60"
    >
      {options.map((u) => (
        <option key={u.id} value={u.id}>
          {u.firstName} {u.lastName}
        </option>
      ))}
    </select>
  )
}
