import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { attachments, projectComments, tags, users } from '@/lib/db/schema'
import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { canDeleteAttachment } from '@/lib/attachments'
import { canManageProject, canOperateOnProject, isOverdue } from '@/lib/permissions'
import { getProjectDetail } from '@/lib/queries/project-detail'
import { getProjectTasks } from '@/lib/queries/tasks'
import { AttachmentSection } from '@/components/AttachmentSection'
import { ActiveBadge, OverdueBadge, PriorityBadge, ProjectStatusBadge } from '@/components/Badge'

import { ArchiveButton } from './ArchiveButton'
import { addProjectFileAttachmentAction, addProjectLinkAttachmentAction, deleteProjectAttachmentAction } from './attachments/actions'
import { CommentSection } from './comments/CommentSection'
import { EditProjectFields } from './EditProjectFields'
import { MemberManager } from './MemberManager'
import { OwnerSelect } from './OwnerSelect'
import { ProgressForm } from './ProgressForm'
import { StatusForm } from './StatusForm'
import { TagManager } from './TagManager'
import { TaskSection } from './tasks/TaskSection'

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const { view } = await searchParams

  const detail = await getProjectDetail(id)
  if (!detail) notFound()

  const { project, requester, unit, owner, members, tags: projectTags, memberIds } = detail

  const canManage = canManageProject(user, project)
  const canOperate = canOperateOnProject(user, project, memberIds)
  const overdue = isOverdue(project.dueDate, project.status)

  const [allActiveUsers, allActiveTags, projectTaskRows, comments, projectAttachments] = await Promise.all([
    db().select().from(users).where(eq(users.isActive, true)).orderBy(users.firstName),
    db().select().from(tags).where(eq(tags.isActive, true)).orderBy(tags.name),
    getProjectTasks(id),
    db()
      .select({ id: projectComments.id, body: projectComments.body, createdAt: projectComments.createdAt, authorFirstName: users.firstName, authorLastName: users.lastName })
      .from(projectComments)
      .innerJoin(users, eq(projectComments.authorId, users.id))
      .where(eq(projectComments.projectId, id))
      .orderBy(desc(projectComments.createdAt)),
    db()
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
      .where(and(eq(attachments.parentType, 'Project'), eq(attachments.parentId, id)))
      .orderBy(desc(attachments.uploadedAt)),
  ])

  const memberOptions = allActiveUsers.filter((u) => u.id !== owner.id && !memberIds.includes(u.id))
  const assigneeOptions = [
    { id: owner.id, name: `${owner.firstName} ${owner.lastName}` },
    ...members.filter((m) => m.isActive).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:underline">
            Progetti
          </Link>
          <span>/</span>
          <span>{project.code}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
            {project.isArchived && <span className="text-sm text-slate-400">(archiviato)</span>}
          </div>
          {canManage && <ArchiveButton projectId={project.id} isArchived={project.isArchived} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Stato</p>
          {canManage ? (
            <StatusForm projectId={project.id} status={project.status} completionDate={project.completionDate} />
          ) : (
            <ProjectStatusBadge status={project.status} />
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Priorità</p>
          <PriorityBadge priority={project.priority} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Richiedente</p>
          <p className="text-sm text-slate-700">
            {fullName(requester)} ({requester.email})
          </p>
          <p className="text-xs text-slate-400">
            {unit.code} — {unit.name}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Owner</p>
          {canManage ? (
            <OwnerSelect projectId={project.id} ownerId={owner.id} options={[owner, ...members.filter((m) => m.isActive)]} />
          ) : (
            <p className="text-sm text-slate-700">{fullName(owner)}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Data richiesta</p>
          <p className="text-sm text-slate-700">{formatDate(project.requestDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Data avvio</p>
          <p className="text-sm text-slate-700">{formatDate(project.startDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Scadenza</p>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            {formatDate(project.dueDate)}
            {overdue && <OverdueBadge />}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Completamento</p>
          <p className="text-sm text-slate-700">{formatDate(project.completionDate)}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="text-xs font-medium uppercase text-slate-400">Avanzamento</p>
          {canManage ? (
            <ProgressForm projectId={project.id} progressPercent={project.progressPercent} />
          ) : (
            <p className="text-sm text-slate-700">{project.progressPercent}%</p>
          )}
          <p className="text-xs text-slate-400">Aggiornato: {formatDateTime(project.progressUpdatedAt)}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="mb-1 text-xs font-medium uppercase text-slate-400">Tag</p>
          {canManage ? (
            <TagManager projectId={project.id} current={projectTags} available={allActiveTags} />
          ) : (
            <div className="flex flex-wrap gap-1">
              {projectTags.map((t) => (
                <span key={t.id} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${t.color}22`, color: t.color }}>
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="mb-1 text-xs font-medium uppercase text-slate-400">Membri</p>
          {canManage ? (
            <MemberManager projectId={project.id} owner={owner} members={members} available={memberOptions} />
          ) : (
            <div className="flex flex-wrap gap-1">
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">{fullName(owner)} (owner)</span>
              {members.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {fullName(m)}
                  {!m.isActive && <ActiveBadge isActive={false} />}
                </span>
              ))}
            </div>
          )}
        </div>
        {project.description && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="mb-1 text-xs font-medium uppercase text-slate-400">Descrizione</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{project.description}</p>
          </div>
        )}
      </div>

      {canManage && (
        <EditProjectFields
          project={{
            id: project.id,
            name: project.name,
            color: project.color,
            description: project.description,
            priority: project.priority,
            requestDate: project.requestDate,
            startDate: project.startDate,
            dueDate: project.dueDate,
          }}
        />
      )}

      <TaskSection projectId={project.id} tasks={projectTaskRows} view={view === 'list' ? 'list' : 'board'} canOperate={canOperate} assigneeOptions={assigneeOptions} />

      <AttachmentSection
        attachments={projectAttachments.map((a) => ({
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
        uploadFileAction={addProjectFileAttachmentAction.bind(null, project.id)}
        uploadLinkAction={addProjectLinkAttachmentAction.bind(null, project.id)}
        deleteAction={deleteProjectAttachmentAction.bind(null, project.id)}
      />

      <CommentSection
        projectId={project.id}
        comments={comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: { firstName: c.authorFirstName, lastName: c.authorLastName } }))}
        canComment={canOperate}
      />

      <Link href={`/projects/${project.id}/audit`} className="text-sm text-indigo-600 hover:underline">
        Vedi audit del progetto →
      </Link>
    </div>
  )
}
