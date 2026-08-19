import { desc, eq, inArray, or } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { auditEntries, projects, tasks, users } from '@/lib/db/schema'
import { formatDateTime } from '@/lib/format'

export default async function ProjectAuditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const [project] = await db().select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) notFound()

  const taskRows = await db().select({ id: tasks.id, title: tasks.title }).from(tasks).where(eq(tasks.projectId, id))
  const taskTitleById = new Map(taskRows.map((t) => [t.id, t.title]))
  const taskIds = taskRows.map((t) => t.id)

  const entries = await db()
    .select({
      id: auditEntries.id,
      entityType: auditEntries.entityType,
      entityId: auditEntries.entityId,
      field: auditEntries.field,
      oldValue: auditEntries.oldValue,
      newValue: auditEntries.newValue,
      changedAt: auditEntries.changedAt,
      changedByFirstName: users.firstName,
      changedByLastName: users.lastName,
    })
    .from(auditEntries)
    .innerJoin(users, eq(auditEntries.changedById, users.id))
    .where(
      taskIds.length > 0
        ? or(eq(auditEntries.entityId, id), inArray(auditEntries.entityId, taskIds))
        : eq(auditEntries.entityId, id),
    )
    .orderBy(desc(auditEntries.changedAt))

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          Progetti
        </Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:underline">
          {project.name}
        </Link>
        <span>/</span>
        <span>Audit</span>
      </div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Audit — {project.name}</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Entità</th>
              <th className="px-4 py-2">Campo</th>
              <th className="px-4 py-2">Da</th>
              <th className="px-4 py-2">A</th>
              <th className="px-4 py-2">Autore</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-slate-500">{formatDateTime(e.changedAt)}</td>
                <td className="px-4 py-2 text-slate-600">
                  {e.entityType === 'Task' ? `Task: ${taskTitleById.get(e.entityId) ?? e.entityId}` : 'Progetto'}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-slate-700">{e.field}</td>
                <td className="px-4 py-2 text-slate-500">{e.oldValue ?? '—'}</td>
                <td className="px-4 py-2 text-slate-700">{e.newValue ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">
                  {e.changedByFirstName} {e.changedByLastName}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nessuna voce di audit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
