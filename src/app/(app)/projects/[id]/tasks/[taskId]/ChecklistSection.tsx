'use client'

import { useTransition } from 'react'

import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  moveChecklistItemAction,
  toggleChecklistItemAction,
} from './actions'

type Item = { id: string; text: string; isDone: boolean }

export function ChecklistSection({
  projectId,
  taskId,
  items,
  canEdit,
}: {
  projectId: string
  taskId: string
  items: Item[]
  canEdit: boolean
}) {
  const [pending, startTransition] = useTransition()
  const addAction = addChecklistItemAction.bind(null, projectId, taskId)

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-pt-ink">Checklist</h2>
      <ul className="mb-3 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded border border-pt-line bg-pt-surface px-2 py-1.5 text-sm">
            <input
              type="checkbox"
              checked={item.isDone}
              disabled={!canEdit || pending}
              onChange={(e) => startTransition(() => toggleChecklistItemAction(projectId, taskId, item.id, e.target.checked))}
            />
            <span className={item.isDone ? 'flex-1 text-pt-ghost line-through' : 'flex-1 text-pt-soft'}>{item.text}</span>
            {canEdit && (
              <div className="flex items-center gap-1 text-xs text-pt-ghost">
                <button type="button" disabled={pending} onClick={() => startTransition(() => moveChecklistItemAction(projectId, taskId, item.id, 'up'))} className="hover:text-pt-soft">
                  ▲
                </button>
                <button type="button" disabled={pending} onClick={() => startTransition(() => moveChecklistItemAction(projectId, taskId, item.id, 'down'))} className="hover:text-pt-soft">
                  ▼
                </button>
                <button type="button" disabled={pending} onClick={() => startTransition(() => deleteChecklistItemAction(projectId, taskId, item.id))} className="text-pt-danger hover:text-pt-overdue">
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-pt-ghost">Nessuna voce.</p>}
      </ul>
      {canEdit && (
        <form action={addAction} className="flex gap-2">
          <input name="text" required placeholder="Nuova voce…" className="flex-1 rounded border border-pt-lineStrong px-2 py-1 text-sm" />
          <button type="submit" className="rounded-md bg-pt-ink px-3 py-1 text-sm text-white hover:bg-pt-soft">
            Aggiungi
          </button>
        </form>
      )}
    </section>
  )
}
