import { eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits, requesters } from '@/lib/db/schema'

import { NewProjectForm } from './NewProjectForm'

export default async function NewProjectPage() {
  await requireUser()

  const rows = await db()
    .select({
      id: requesters.id,
      firstName: requesters.firstName,
      lastName: requesters.lastName,
      unitName: organizationalUnits.name,
    })
    .from(requesters)
    .innerJoin(organizationalUnits, eq(requesters.unitId, organizationalUnits.id))
    .where(eq(requesters.isActive, true))
    .orderBy(requesters.lastName)

  return (
    <div>
      <h1 className="mb-4 font-serif text-[26px] font-medium text-pt-ink">Nuovo progetto</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-pt-muted">
          Nessun richiedente attivo. Crea prima un richiedente dalle{' '}
          <a href="/admin/requesters" className="text-pt-accent hover:underline">
            anagrafiche
          </a>
          .
        </p>
      ) : (
        <NewProjectForm requesters={rows} />
      )}
    </div>
  )
}
