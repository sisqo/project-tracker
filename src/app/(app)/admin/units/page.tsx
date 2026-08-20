import { desc } from 'drizzle-orm'

import { requireAdmin } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits } from '@/lib/db/schema'
import { ActiveBadge } from '@/components/Badge'
import { ActiveToggle } from '@/components/ActiveToggle'

import { CreateUnitForm } from './CreateUnitForm'
import { setUnitActiveAction } from './actions'

export default async function UnitsPage() {
  await requireAdmin()
  const units = await db().select().from(organizationalUnits).orderBy(desc(organizationalUnits.createdAt))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-[26px] font-medium text-pt-ink">Unità organizzative</h1>
      <CreateUnitForm />
      <div className="overflow-x-auto rounded-md border border-pt-line bg-pt-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-pt-line bg-pt-surfaceSoft font-mono text-[10.5px] uppercase tracking-[0.1em] text-pt-faint">
            <tr>
              <th className="px-4 py-2">Codice</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Stato</th>
              <th className="px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b border-pt-line/70 last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{u.code}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">
                  <ActiveBadge isActive={u.isActive} />
                </td>
                <td className="px-4 py-2">
                  <ActiveToggle id={u.id} isActive={u.isActive} action={setUnitActiveAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
