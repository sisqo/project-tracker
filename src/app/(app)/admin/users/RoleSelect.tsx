'use client'

import { useTransition } from 'react'

import { updateUserRoleAction } from './actions'

export function RoleSelect({ userId, role }: { userId: string; role: 'Administrator' | 'User' }) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => startTransition(() => updateUserRoleAction(userId, e.target.value as 'Administrator' | 'User'))}
      className="rounded border border-slate-300 px-2 py-1 text-sm disabled:opacity-60"
    >
      <option value="User">User</option>
      <option value="Administrator">Administrator</option>
    </select>
  )
}
