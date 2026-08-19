import { desc } from 'drizzle-orm'

import { requireAdmin } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { ActiveBadge } from '@/components/Badge'

import { CreateUserForm } from './CreateUserForm'
import { DeactivateButton } from './DeactivateButton'
import { ResetLinkButton } from './ResetLinkButton'
import { RoleSelect } from './RoleSelect'

export default async function UsersPage() {
  const admin = await requireAdmin()
  const allUsers = await db().select().from(users).orderBy(desc(users.createdAt))

  return (
    <div>
      <CreateUserForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Ruolo</th>
              <th className="px-4 py-2">Stato</th>
              <th className="px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2">
                  <RoleSelect userId={u.id} role={u.role} />
                </td>
                <td className="px-4 py-2">
                  <ActiveBadge isActive={u.isActive} />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-4">
                    <ResetLinkButton userId={u.id} />
                    {u.id !== admin.id && <DeactivateButton userId={u.id} isActive={u.isActive} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
