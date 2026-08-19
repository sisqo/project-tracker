import { formatDateTime, fullName } from '@/lib/format'

import { addCommentAction } from './actions'

type Comment = {
  id: string
  body: string
  createdAt: Date
  author: { firstName: string; lastName: string }
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
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Commenti</h2>
      <div className="mb-3 space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">{fullName(c.author)}</span>
              <span>{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-slate-400">Nessun commento.</p>}
      </div>
      {canComment && (
        <form action={action} className="flex gap-2">
          <textarea
            name="body"
            rows={2}
            required
            placeholder="Aggiungi un aggiornamento…"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="self-end rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Invia
          </button>
        </form>
      )}
    </section>
  )
}
