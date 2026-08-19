import { desc } from 'drizzle-orm'

import { requireAdmin } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { tags } from '@/lib/db/schema'
import { ActiveBadge } from '@/components/Badge'
import { ActiveToggle } from '@/components/ActiveToggle'

import { CreateTagForm } from './CreateTagForm'
import { setTagActiveAction } from './actions'

export default async function TagsPage() {
  await requireAdmin()
  const allTags = await db().select().from(tags).orderBy(desc(tags.createdAt))

  return (
    <div>
      <CreateTagForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Tag</th>
              <th className="px-4 py-2">Stato</th>
              <th className="px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {allTags.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <ActiveBadge isActive={t.isActive} />
                </td>
                <td className="px-4 py-2">
                  <ActiveToggle id={t.id} isActive={t.isActive} action={setTagActiveAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
