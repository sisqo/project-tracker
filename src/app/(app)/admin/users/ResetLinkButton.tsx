'use client'

import { useState, useTransition } from 'react'

import { generateResetLinkAction } from './actions'

export function ResetLinkButton({ userId }: { userId: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-1 px-3 py-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setLink(await generateResetLinkAction(userId)))}
        className="text-sm text-pt-accent hover:text-pt-accentDark disabled:opacity-60"
      >
        {pending ? 'Generazione…' : 'Genera link password'}
      </button>
      {link && (
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="w-72 rounded border border-pt-lineStrong px-2 py-1 text-xs"
        />
      )}
    </div>
  )
}
