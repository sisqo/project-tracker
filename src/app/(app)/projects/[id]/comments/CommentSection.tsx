import { Avatar } from '@/components/Avatar'
import { formatDateTime, fullName } from '@/lib/format'

import { addCommentAction } from './actions'

type Comment = {
  id: string
  body: string
  createdAt: Date
  author: { id: string; firstName: string; lastName: string }
}

export function CommentSection({
  projectId,
  comments,
  canComment,
}: {
  projectId: string
  comments: Comment[]
  canComment: boolean
}) {
  const action = addCommentAction.bind(null, projectId)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5 rounded-md border border-pt-line bg-pt-surface p-3 text-sm">
            <Avatar id={c.author.id} firstName={c.author.firstName} lastName={c.author.lastName} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-xs text-pt-faint">
                <span className="font-medium text-pt-soft">{fullName(c.author)}</span>
                <span>{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-pt-soft">{c.body}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-pt-ghost">Nessun commento.</p>}
      </div>
      {canComment && (
        <form action={action} className="flex gap-2">
          <textarea
            name="body"
            rows={2}
            required
            placeholder="Aggiungi un aggiornamento…"
            className="flex-1 rounded border border-pt-lineStrong px-3 py-2 text-sm"
          />
          <button type="submit" className="self-end rounded-md bg-pt-accent px-3 py-2 text-sm font-medium text-white hover:bg-pt-accentDark">
            Invia
          </button>
        </form>
      )}
    </div>
  )
}
