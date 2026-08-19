import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'

import { db } from '@/lib/db/client'
import { projects, users } from '@/lib/db/schema'
import { getOpenTasksForProjectMember, getProjectMemberOptions } from '@/lib/reassignment'

import { removeMemberWithReassignmentAction } from './actions'

export default async function RemoveMemberPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>
}) {
  const { id, userId } = await params
  const [project] = await db().select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) notFound()
  const [member] = await db().select().from(users).where(eq(users.id, userId)).limit(1)
  if (!member) notFound()

  const openTasks = await getOpenTasksForProjectMember(id, userId)
  if (openTasks.length === 0) redirect(`/projects/${id}`)

  const options = await getProjectMemberOptions(id, userId)
  const action = removeMemberWithReassignmentAction.bind(null, id, userId)

  return (
    <div className="max-w-2xl">
      <h2 className="mb-2 text-base font-semibold text-slate-900">
        Rimuovi {member.firstName} {member.lastName} da {project.name}
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Ha {openTasks.length} task aperti in questo progetto. Scegli a chi riassegnarli (o lascia
        vuoto per azzerare l&apos;assegnatario) prima di procedere.
      </p>
      <form action={action} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white">
          {openTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0">
              <p className="text-sm font-medium text-slate-900">{task.title}</p>
              <select name={`assignee-${task.id}`} className="rounded border border-slate-300 px-2 py-1 text-sm">
                <option value="">— nessuno —</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">
          Conferma riassegnazioni e rimuovi
        </button>
      </form>
    </div>
  )
}
