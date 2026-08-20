import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireUser } from '@/lib/auth/current-user'
import { canDeleteAttachment } from '@/lib/attachments'
import { db } from '@/lib/db/client'
import { attachments, checklistItems, projects, tasks, users } from '@/lib/db/schema'
import { canOperateOnProject } from '@/lib/permissions'
import { getProjectMemberIds } from '@/lib/queries/projects'
import { AttachmentSection } from '@/components/AttachmentSection'
import { PriorityBadge, TaskStatusBadge } from '@/components/Badge'

import { addTaskFileAttachmentAction, addTaskLinkAttachmentAction, deleteTaskAttachmentAction } from './attachment-actions'
import { ChecklistSection } from './ChecklistSection'
import { EditTaskForm } from './EditTaskForm'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const user = await requireUser()
  const { id: projectId, taskId } = await params

  const [project] = await db().select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) notFound()
  const [task] = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task || task.projectId !== projectId) notFound()

  const memberIds = await getProjectMemberIds(projectId)
  const canOperate = canOperateOnProject(user, project, memberIds)

  const [owner] = await db().select().from(users).where(eq(users.id, project.ownerId)).limit(1)
  const memberUsers = await db()
    .select()
    .from(users)
    .where(eq(users.isActive, true))
  const assigneeOptions = [owner, ...memberUsers.filter((u) => memberIds.includes(u.id))]
    .filter((u): u is NonNullable<typeof u> => !!u)
    .map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))

  const items = await db().select().from(checklistItems).where(eq(checklistItems.taskId, taskId)).orderBy(checklistItems.sortOrder)

  const taskAttachments = await db()
    .select({
      id: attachments.id,
      type: attachments.type,
      label: attachments.label,
      url: attachments.url,
      fileRef: attachments.fileRef,
      uploadedAt: attachments.uploadedAt,
      uploadedById: attachments.uploadedById,
      uploaderFirstName: users.firstName,
      uploaderLastName: users.lastName,
    })
    .from(attachments)
    .innerJoin(users, eq(attachments.uploadedById, users.id))
    .where(and(eq(attachments.parentType, 'Task'), eq(attachments.parentId, taskId)))
    .orderBy(desc(attachments.uploadedAt))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs text-pt-ghost">
          <Link href="/" className="hover:underline">
            Progetti
          </Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:underline">
            {project.name}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-medium text-pt-ink">{task.title}</h1>
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      <EditTaskForm
        projectId={projectId}
        taskId={taskId}
        task={{
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          assigneeId: task.assigneeId,
        }}
        assigneeOptions={assigneeOptions}
        disabled={!canOperate}
      />

      <ChecklistSection projectId={projectId} taskId={taskId} items={items} canEdit={canOperate} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-pt-ink">Allegati</h2>
        <AttachmentSection
          attachments={taskAttachments.map((a) => ({
            id: a.id,
            type: a.type,
            label: a.label,
            url: a.url,
            fileRef: a.fileRef,
            uploadedAt: a.uploadedAt,
            uploaderName: `${a.uploaderFirstName} ${a.uploaderLastName}`,
            canDelete: canDeleteAttachment(user, { uploadedById: a.uploadedById }, project),
          }))}
          canUpload={canOperate}
          uploadFileAction={addTaskFileAttachmentAction.bind(null, projectId, taskId)}
          uploadLinkAction={addTaskLinkAttachmentAction.bind(null, projectId, taskId)}
          deleteAction={deleteTaskAttachmentAction.bind(null, projectId, taskId)}
        />
      </div>
    </div>
  )
}
