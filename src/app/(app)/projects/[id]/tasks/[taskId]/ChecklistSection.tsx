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
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Checklist</h2>
      <ul className="mb-3 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm">
            <input
              type="checkbox"
              checked={item.isDone}
              disabled={!canEdit || pending}
              onChange={(e) => startTransition(() => toggleChecklistItemAction(projectId, taskId, item.id, e.target.checked))}
            />
            <span className={item.isDone ? 'flex-1 text-slate-400 line-through' : 'flex-1 text-slate-700'}>{item.text}</span>
            {canEdit && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <button type="button" disabled={pending} onClick={() => startTransition(() => moveChecklistItemAction(projectId, taskId, item.id, 'up'))} className="hover:text-slate-700">
                  ▲
                </button>
                <button type="button" disabled={pending} onClick={() => startTransition(() => moveChecklistItemAction(projectId, taskId, item.id, 'down'))} className="hover:text-slate-700">
                  ▼
                </button>
                <button type="button" disabled={pending} onClick={() => startTransition(() => deleteChecklistItemAction(projectId, taskId, item.id))} className="text-rose-500 hover:text-rose-700">
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Nessuna voce.</p>}
      </ul>
      {canEdit && (
        <form action={addAction} className="flex gap-2">
          <input name="text" required placeholder="Nuova voce…" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
          <button type="submit" className="rounded-md bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700">
            Aggiungi
          </button>
        </form>
      )}
    </section>
  )
}
