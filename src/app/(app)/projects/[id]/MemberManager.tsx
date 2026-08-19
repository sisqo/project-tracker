'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { addMemberAction, removeMemberAction } from './actions'

type Member = { id: string; firstName: string; lastName: string; isActive: boolean }
type Option = { id: string; firstName: string; lastName: string }

export function MemberManager({
  projectId,
  owner,
  members,
  available,
}: {
  projectId: string
  owner: { id: string; firstName: string; lastName: string }
  members: Member[]
  available: Option[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const takenIds = new Set([owner.id, ...members.map((m) => m.id)])
  const options = available.filter((u) => !takenIds.has(u.id))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">
        {owner.firstName} {owner.lastName} (owner)
      </span>
      {members.map((m) => (
        <span
          key={m.id}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-400'}`}
        >
          {m.firstName} {m.lastName}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await removeMemberAction(projectId, m.id)
                if (result.blocked) router.push(`/projects/${projectId}/members/${m.id}/remove`)
              })
            }
            className="ml-0.5 hover:opacity-70"
            aria-label={`Rimuovi ${m.firstName} ${m.lastName}`}
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
            if (e.target.value) startTransition(() => addMemberAction(projectId, e.target.value))
            e.target.value = ''
          }}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="" disabled>
            + aggiungi membro
          </option>
          {options.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
