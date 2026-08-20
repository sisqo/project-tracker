'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Avatar } from '@/components/Avatar'

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
  const [adding, setAdding] = useState(false)
  const takenIds = new Set([owner.id, ...members.map((m) => m.id)])
  const options = available.filter((u) => !takenIds.has(u.id))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {members.map((m) => (
        <span
          key={m.id}
          className={`inline-flex items-center gap-1.5 rounded-full bg-pt-shell py-[3px] pl-[3px] pr-2.5 text-[12.5px] ${m.isActive ? 'text-pt-soft' : 'text-pt-ghost'}`}
        >
          <Avatar id={m.id} firstName={m.firstName} lastName={m.lastName} size="sm" />
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
            className="hover:opacity-70"
            aria-label={`Rimuovi ${m.firstName} ${m.lastName}`}
          >
            ×
          </button>
        </span>
      ))}
      {options.length > 0 &&
        (adding ? (
          <select
            disabled={pending}
            defaultValue=""
            autoFocus
            onBlur={() => setAdding(false)}
            onChange={(e) => {
              if (e.target.value) startTransition(() => addMemberAction(projectId, e.target.value))
              setAdding(false)
            }}
            className="rounded border border-pt-lineStrong px-2 py-1 text-xs"
          >
            <option value="" disabled>
              scegli utente
            </option>
            {options.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center rounded-full border border-dashed border-pt-dashed px-2.5 py-[3px] text-[12.5px] text-pt-muted hover:border-pt-ghost"
          >
            + Aggiungi
          </button>
        ))}
    </div>
  )
}
