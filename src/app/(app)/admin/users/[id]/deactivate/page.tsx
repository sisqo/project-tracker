import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { getOpenTasksForUser, getProjectMemberOptions } from '@/lib/reassignment'

import { deactivateUserWithReassignmentAction } from './actions'

export default async function DeactivateUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [user] = await db().select().from(users).where(eq(users.id, id)).limit(1)
  if (!user) notFound()

  const openTasks = await getOpenTasksForUser(id)
  if (openTasks.length === 0) redirect('/admin/users')

  const tasksWithOptions = await Promise.all(
    openTasks.map(async (task) => ({
      ...task,
      options: await getProjectMemberOptions(task.projectId, id),
    })),
  )

  const action = deactivateUserWithReassignmentAction.bind(null, id)

  return (
    <div className="max-w-2xl">
      <h2 className="mb-2 text-base font-semibold text-slate-900">
        Disattiva {user.firstName} {user.lastName}
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Questo utente ha {openTasks.length} task aperti assegnati. Scegli, per ognuno, a chi
        riassegnarlo (o lascia vuoto per azzerare l&apos;assegnatario) prima di procedere.
      </p>
      <form action={action} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white">
          {tasksWithOptions.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.projectName}</p>
              </div>
              <select name={`assignee-${task.id}`} className="rounded border border-slate-300 px-2 py-1 text-sm">
                <option value="">— nessuno —</option>
                {task.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">
          Conferma riassegnazioni e disattiva
        </button>
      </form>
    </div>
  )
}
