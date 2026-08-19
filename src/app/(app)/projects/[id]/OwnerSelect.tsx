'use client'

import { useTransition } from 'react'

import { updateOwnerAction } from './actions'

type Option = { id: string; firstName: string; lastName: string }

export function OwnerSelect({ projectId, ownerId, options }: { projectId: string; ownerId: string; options: Option[] }) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      defaultValue={ownerId}
      disabled={pending}
      onChange={(e) => startTransition(() => updateOwnerAction(projectId, e.target.value))}
      className="rounded border border-slate-300 px-2 py-1 text-sm disabled:opacity-60"
    >
      {options.map((u) => (
        <option key={u.id} value={u.id}>
          {u.firstName} {u.lastName}
        </option>
      ))}
    </select>
  )
}
