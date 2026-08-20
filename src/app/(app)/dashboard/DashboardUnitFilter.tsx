'use client'

import { useRouter } from 'next/navigation'

type Unit = { id: string; code: string; name: string }

export function DashboardUnitFilter({ units, current }: { units: Unit[]; current: string | undefined }) {
  const router = useRouter()

  return (
    <select
      defaultValue={current ?? ''}
      onChange={(e) => router.push(e.target.value ? `/dashboard?unit=${e.target.value}` : '/dashboard')}
      className="border-none bg-transparent text-[12.5px] text-pt-faint focus:outline-none"
    >
      <option value="">Unità: tutte</option>
      {units.map((u) => (
        <option key={u.id} value={u.id}>
          {u.code} — {u.name}
        </option>
      ))}
    </select>
  )
}
