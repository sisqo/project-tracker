import { desc } from 'drizzle-orm'

import { requireAdmin } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { Avatar } from '@/components/Avatar'
import { ActiveBadge } from '@/components/Badge'
import { DropdownMenu } from '@/components/DropdownMenu'

import { CreateUserForm } from './CreateUserForm'
import { DeactivateButton } from './DeactivateButton'
import { ResetLinkButton } from './ResetLinkButton'
import { RoleSelect } from './RoleSelect'

export default async function UsersPage() {
  const admin = await requireAdmin()
  const allUsers = await db().select().from(users).orderBy(desc(users.createdAt))
  const activeCount = allUsers.filter((u) => u.isActive).length

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-[26px] font-medium text-pt-ink">Utenti</h1>
        <p className="mt-1 text-[13px] text-pt-faint">
          {activeCount} attivi · {allUsers.length - activeCount} disattivati
        </p>
      </div>

      <CreateUserForm />

      <div className="overflow-x-auto rounded-md border border-pt-line bg-pt-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-pt-line bg-pt-surfaceSoft font-mono text-[10.5px] uppercase tracking-[0.1em] text-pt-faint">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Ruolo</th>
              <th className="px-4 py-2">Stato</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-b border-pt-line/70 last:border-0">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar id={u.id} firstName={u.firstName} lastName={u.lastName} />
                    <span className={u.isActive ? 'text-pt-ink' : 'text-pt-faint'}>
                      {u.firstName} {u.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-pt-muted">{u.email}</td>
                <td className="px-4 py-2">
                  <RoleSelect userId={u.id} role={u.role} />
                </td>
                <td className="px-4 py-2">
                  <ActiveBadge isActive={u.isActive} />
                </td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <ResetLinkButton userId={u.id} />
                    {u.id !== admin.id && <DeactivateButton userId={u.id} isActive={u.isActive} />}
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12.5px] text-pt-faint">
        <span className="rounded-full border border-pt-line bg-pt-surface px-2.5 py-[3px]">
          Link di primo accesso e reset si generano dal menu ··· della riga
        </span>
      </p>
    </div>
  )
}
