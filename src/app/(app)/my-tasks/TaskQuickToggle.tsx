'use client'

import { useTransition } from 'react'

import { updateTaskStatusAction } from '../projects/[id]/tasks/actions'

export function TaskQuickToggle({ projectId, taskId, status }: { projectId: string; taskId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const done = status === 'Completed'

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => updateTaskStatusAction(projectId, taskId, done ? 'Todo' : 'Completed'))}
      aria-label={done ? 'Segna come da fare' : 'Segna come completato'}
      className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[10px] leading-none disabled:opacity-50 ${
        done ? 'border-pt-good bg-pt-good text-white' : 'border-pt-dashed text-transparent'
      }`}
    >
      ✓
    </button>
  )
}
