'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { projectComments, projects } from '@/lib/db/schema'
import { canOperateOnProject } from '@/lib/permissions'
import { getProjectMemberIds } from '@/lib/queries/projects'

export async function addCommentAction(projectId: string, formData: FormData): Promise<void> {
  const user = await requireUser()
  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new Error('Progetto non trovato.')

  const memberIds = await getProjectMemberIds(projectId)
  if (!canOperateOnProject(user, project, memberIds)) throw new Error('Non autorizzato.')

  const body = String(formData.get('body') ?? '').trim()
  if (!body) return

  await db().insert(projectComments).values({ projectId, authorId: user.id, body })
  revalidatePath(`/projects/${projectId}`)
}
