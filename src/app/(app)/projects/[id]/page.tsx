import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { attachments, projectComments, tags, users } from '@/lib/db/schema'
import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { canDeleteAttachment } from '@/lib/attachments'
import { canManageProject, canOperateOnProject, isOverdue } from '@/lib/permissions'
import { getProjectAuditEntries, type ProjectAuditEntry } from '@/lib/queries/audit'
import { getProjectDetail } from '@/lib/queries/project-detail'
import { getProjectTasks } from '@/lib/queries/tasks'
import { AttachmentSection } from '@/components/AttachmentSection'
import { Avatar } from '@/components/Avatar'
import { ActiveBadge, PriorityBadge, ProjectStatusBadge } from '@/components/Badge'
import { DropdownMenu } from '@/components/DropdownMenu'
import { ProgressBar } from '@/components/ProgressBar'

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

const TABS = [
  { value: 'task', label: 'Task' },
  { value: 'attachments', label: 'Allegati' },
  { value: 'comments', label: 'Commenti' },
  { value: 'audit', label: 'Audit' },
] as const
type Tab = (typeof TABS)[number]['value']

const FIELD_LABELS: Record<string, string> = {
  status: 'stato',
  priority: 'priorità',
  progressPercent: 'avanzamento',
  owner: 'owner',
  members: 'membri',
  tags: 'tag',
  name: 'nome',
  description: 'descrizione',
  dueDate: 'scadenza',
  startDate: 'data avvio',
  requestDate: 'data richiesta',
  completionDate: 'completamento',
  color: 'colore',
  isArchived: 'archiviazione',
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string; tab?: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const { view, tab: tabParam } = await searchParams
  const tab: Tab = TABS.some((t) => t.value === tabParam) ? (tabParam as Tab) : 'task'

  const detail = await getProjectDetail(id)
  if (!detail) notFound()

  const { project, requester, unit, owner, members, tags: projectTags, memberIds } = detail

  const canManage = canManageProject(user, project)
  const canOperate = canOperateOnProject(user, project, memberIds)
  const overdue = isOverdue(project.dueDate, project.status)

  const [allActiveUsers, allActiveTags, projectTaskRows, comments, projectAttachments, auditEntries] = await Promise.all([
    db().select().from(users).where(eq(users.isActive, true)).orderBy(users.firstName),
    db().select().from(tags).where(eq(tags.isActive, true)).orderBy(tags.name),
    getProjectTasks(id),
    db()
      .select({
        id: projectComments.id,
        body: projectComments.body,
        createdAt: projectComments.createdAt,
        authorId: projectComments.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
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
    getProjectAuditEntries(id),
  ])

  const memberOptions = allActiveUsers.filter((u) => u.id !== owner.id && !memberIds.includes(u.id))
  const assigneeOptions = [
    { id: owner.id, name: `${owner.firstName} ${owner.lastName}` },
    ...members.filter((m) => m.isActive).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
  ]

  const daysRemaining = project.dueDate ? Math.round((new Date(project.dueDate).getTime() - Date.now()) / 86400000) : null

  const recentActivity = [
    ...comments.map((c) => ({
      kind: 'comment' as const,
      at: c.createdAt,
      authorId: c.authorId,
      authorName: `${c.authorFirstName} ${c.authorLastName}`,
      body: c.body,
    })),
    ...auditEntries
      .filter((e) => e.entityType === 'Project')
      .map((e) => ({
        kind: 'audit' as const,
        at: e.changedAt,
        authorId: e.changedById,
        authorName: `${e.changedByFirstName} ${e.changedByLastName}`,
        body: `ha aggiornato ${FIELD_LABELS[e.field] ?? e.field}: ${e.oldValue ?? '—'} → ${e.newValue ?? '—'}`,
      })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-pt-line bg-pt-surface px-8 pb-0 pt-[18px]">
        <div className="flex items-center gap-2 text-xs text-pt-subtle">
          <Link href="/" className="hover:underline">
            Progetti
          </Link>
          <span>/</span>
          <span className="font-mono">{project.code}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: project.color }} />
            <h1 className="font-serif text-[27px] font-medium text-pt-ink">{project.name}</h1>
            {project.isArchived && <span className="text-sm text-pt-ghost">(archiviato)</span>}
            {canManage ? <StatusForm projectId={project.id} status={project.status} completionDate={project.completionDate} /> : <ProjectStatusBadge status={project.status} />}
            <PriorityBadge priority={project.priority} />
          </div>
          {canManage && (
            <DropdownMenu>
              <ArchiveButton projectId={project.id} isArchived={project.isArchived} />
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-5">
          {canManage ? (
            <ProgressForm projectId={project.id} progressPercent={project.progressPercent} />
          ) : (
            <div className="flex min-w-[280px] items-center gap-2.5">
              <span className="text-xs text-pt-faint">Avanzamento</span>
              <ProgressBar percent={project.progressPercent} className="max-w-[150px]" />
              <span className="font-mono text-[13px] text-pt-ink">{project.progressPercent}%</span>
            </div>
          )}
          <span className="text-xs text-pt-subtle">
            Aggiornato {formatDate(project.progressUpdatedAt)} · scadenza {formatDate(project.dueDate)}
            {overdue ? (
              <span className="ml-2 text-pt-overdue">in ritardo</span>
            ) : (
              daysRemaining !== null && <span> · {daysRemaining} giorni rimanenti</span>
            )}
          </span>
        </div>

        <nav className="mt-4 flex gap-5">
          {TABS.map((t) => {
            const active = t.value === tab
            const count = t.value === 'task' ? projectTaskRows.length : t.value === 'attachments' ? projectAttachments.length : t.value === 'comments' ? comments.length : null
            return (
              <Link
                key={t.value}
                href={`/projects/${project.id}?tab=${t.value}`}
                className={`pb-2.5 text-[13.5px] ${active ? 'font-medium text-pt-accent shadow-[inset_0_-2px_0_theme(colors.pt.accent)]' : 'text-pt-muted hover:text-pt-ink'}`}
              >
                {t.label} {count !== null && <span className={active ? 'text-pt-accentText' : 'text-pt-ghost'}>{count}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          {tab === 'task' && (
            <>
              <TaskSection projectId={project.id} tasks={projectTaskRows} view={view === 'list' ? 'list' : 'board'} canOperate={canOperate} assigneeOptions={assigneeOptions} />
              <div className="rounded-md border border-pt-line bg-pt-surface p-4">
                <h2 className="mb-3 font-serif text-lg font-medium text-pt-ink">Attività recente</h2>
                <div className="flex flex-col gap-3.5">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex gap-2.5">
                      <Avatar id={item.authorId} firstName={item.authorName.split(' ')[0]} lastName={item.authorName.split(' ')[1] ?? ''} />
                      <div className="min-w-0">
                        <div className="text-[13px] text-pt-ink">
                          {item.authorName} <span className="text-pt-subtle">— {formatDateTime(item.at)}</span>
                        </div>
                        <div className="text-[13.5px] leading-[1.55] text-pt-soft">{item.body}</div>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && <p className="text-sm text-pt-ghost">Nessuna attività recente.</p>}
                </div>
              </div>
            </>
          )}

          {tab === 'attachments' && (
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
          )}

          {tab === 'comments' && (
            <CommentSection
              projectId={project.id}
              comments={comments.map((c) => ({
                id: c.id,
                body: c.body,
                createdAt: c.createdAt,
                author: { id: c.authorId, firstName: c.authorFirstName, lastName: c.authorLastName },
              }))}
              canComment={canOperate}
            />
          )}

          {tab === 'audit' && <AuditTable entries={auditEntries} />}
        </div>

        <aside className="flex w-[296px] shrink-0 flex-col gap-3">
          <div className="flex flex-col gap-3.5 rounded-md border border-pt-line bg-pt-surface p-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pt-subtle">Richiedente</div>
              <div className="mt-[3px] text-[13.5px] text-pt-ink">{fullName(requester)}</div>
              <div className="text-[12.5px] text-pt-faint">
                {unit.code} — {unit.name}
              </div>
              <div className="text-[12.5px] text-pt-accent">{requester.email}</div>
            </div>
            <div className="h-px bg-pt-line" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pt-subtle">Owner</div>
              <div className="mt-[5px]">
                {canManage ? (
                  <OwnerSelect projectId={project.id} ownerId={owner.id} options={[owner, ...members.filter((m) => m.isActive)]} />
                ) : (
                  <div className="flex items-center gap-2">
                    <Avatar id={owner.id} firstName={owner.firstName} lastName={owner.lastName} />
                    <span className="text-[13.5px] text-pt-ink">{fullName(owner)}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pt-subtle">Membri</div>
              <div className="mt-1.5">
                {canManage ? (
                  <MemberManager projectId={project.id} owner={owner} members={members} available={memberOptions} />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => (
                      <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-pt-shell px-2.5 py-1 text-[12.5px] text-pt-soft">
                        {fullName(m)}
                        {!m.isActive && <ActiveBadge isActive={false} />}
                      </span>
                    ))}
                    {members.length === 0 && <p className="text-xs text-pt-ghost">Nessun membro.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-pt-line bg-pt-surface p-4">
            <DateRow label="Data richiesta" value={formatDate(project.requestDate)} />
            <DateRow label="Data avvio" value={formatDate(project.startDate)} />
            <DateRow label="Scadenza" value={formatDate(project.dueDate)} />
            <DateRow label="Completamento" value={formatDate(project.completionDate)} />
          </div>

          <div className="rounded-md border border-pt-line bg-pt-surface p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pt-subtle">Tag</div>
            <div className="mt-2">
              {canManage ? (
                <TagManager projectId={project.id} current={projectTags} available={allActiveTags} />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {projectTags.map((t) => (
                    <span key={t.id} className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${t.color}22`, color: t.color }}>
                      {t.name}
                    </span>
                  ))}
                  {projectTags.length === 0 && <p className="text-xs text-pt-ghost">Nessun tag.</p>}
                </div>
              )}
            </div>
          </div>

          {project.description && (
            <div className="rounded-md border border-pt-line bg-pt-surface p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pt-subtle">Descrizione</div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.6] text-pt-soft">{project.description}</p>
            </div>
          )}

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
        </aside>
      </div>
    </div>
  )
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-pt-faint">{label}</span>
      <span className="font-mono text-pt-ink">{value}</span>
    </div>
  )
}

function AuditTable({ entries }: { entries: ProjectAuditEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-pt-line bg-pt-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-pt-line bg-pt-surfaceSoft font-mono text-[10.5px] uppercase tracking-[0.1em] text-pt-faint">
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
            <tr key={e.id} className="border-b border-pt-line/70 last:border-0">
              <td className="whitespace-nowrap px-4 py-2 text-pt-faint">{formatDateTime(e.changedAt)}</td>
              <td className="px-4 py-2 text-pt-muted">{e.entityType === 'Task' ? `Task: ${e.taskTitle}` : 'Progetto'}</td>
              <td className="px-4 py-2 font-mono text-xs text-pt-soft">{FIELD_LABELS[e.field] ?? e.field}</td>
              <td className="px-4 py-2 text-pt-faint">{e.oldValue ?? '—'}</td>
              <td className="px-4 py-2 text-pt-soft">{e.newValue ?? '—'}</td>
              <td className="px-4 py-2 text-pt-muted">
                {e.changedByFirstName} {e.changedByLastName}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-pt-ghost">
                Nessuna voce di audit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
