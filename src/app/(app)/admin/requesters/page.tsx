import { desc, eq } from 'drizzle-orm'

import { requireAdmin } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits, requesters } from '@/lib/db/schema'
import { ActiveBadge } from '@/components/Badge'
import { ActiveToggle } from '@/components/ActiveToggle'

import { CreateRequesterForm } from './CreateRequesterForm'
import { setRequesterActiveAction } from './actions'

export default async function RequestersPage() {
  await requireAdmin()
  const units = await db()
    .select()
    .from(organizationalUnits)
    .where(eq(organizationalUnits.isActive, true))
    .orderBy(organizationalUnits.name)

  const allRequesters = await db()
    .select({
      id: requesters.id,
      firstName: requesters.firstName,
      lastName: requesters.lastName,
      email: requesters.email,
      isActive: requesters.isActive,
      unitCode: organizationalUnits.code,
      unitName: organizationalUnits.name,
    })
    .from(requesters)
    .innerJoin(organizationalUnits, eq(requesters.unitId, organizationalUnits.id))
    .orderBy(desc(requesters.createdAt))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-[26px] font-medium text-pt-ink">Richiedenti</h1>
      <CreateRequesterForm units={units} />
      <div className="overflow-x-auto rounded-md border border-pt-line bg-pt-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-pt-line bg-pt-surfaceSoft font-mono text-[10.5px] uppercase tracking-[0.1em] text-pt-faint">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Unità</th>
              <th className="px-4 py-2">Stato</th>
              <th className="px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {allRequesters.map((r) => (
              <tr key={r.id} className="border-b border-pt-line/70 last:border-0">
                <td className="px-4 py-2">
                  {r.firstName} {r.lastName}
                </td>
                <td className="px-4 py-2 text-pt-muted">{r.email}</td>
                <td className="px-4 py-2 text-pt-muted">
                  {r.unitCode} — {r.unitName}
                </td>
                <td className="px-4 py-2">
                  <ActiveBadge isActive={r.isActive} />
                </td>
                <td className="px-4 py-2">
                  <ActiveToggle id={r.id} isActive={r.isActive} action={setRequesterActiveAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
