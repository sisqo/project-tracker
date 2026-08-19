import { eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth/current-user'
import { toCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'
import { getProjectTasks } from '@/lib/queries/tasks'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const [project] = await db().select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) return new Response('Not found', { status: 404 })

  const rows = await getProjectTasks(id)

  const csv = toCsv(
    ['Titolo', 'Stato', 'Priorità', 'Assegnatario', 'Scadenza', 'Ore stimate'],
    rows.map((t) => [
      t.title,
      t.status,
      t.priority,
      t.assigneeFirstName ? `${t.assigneeFirstName} ${t.assigneeLastName}` : '',
      formatDate(t.dueDate),
      t.estimatedHours ?? '',
    ]),
  )

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="task-${project.code}.csv"`,
    },
  })
}
