import type { NextRequest } from 'next/server'

import { requireUser } from '@/lib/auth/current-user'
import { toCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { getFilteredProjects, parseProjectFilters } from '@/lib/queries/projects'

export async function GET(request: NextRequest) {
  await requireUser()

  const sp = Object.fromEntries(request.nextUrl.searchParams.entries())
  const filters = parseProjectFilters(sp)
  const rows = await getFilteredProjects(filters)

  const csv = toCsv(
    ['Codice', 'Nome', 'Stato', 'Priorità', 'Richiedente', 'Unità', 'Owner', 'Scadenza', 'Avanzamento %', 'Archiviato'],
    rows.map((p) => [
      p.code,
      p.name,
      p.status,
      p.priority,
      p.requesterName,
      p.unitName,
      p.ownerName,
      formatDate(p.dueDate),
      p.progressPercent,
      p.isArchived ? 'Sì' : 'No',
    ]),
  )

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="progetti.csv"',
    },
  })
}
