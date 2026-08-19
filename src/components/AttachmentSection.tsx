'use client'

import { useActionState, useTransition } from 'react'

import { formatDateTime } from '@/lib/format'

export type AttachmentRow = {
  id: string
  type: 'File' | 'Link'
  label: string
  url: string | null
  fileRef: string | null
  uploadedAt: Date
  uploaderName: string
  canDelete: boolean
}

type UploadState = { error?: string } | undefined

type UploadAction = (prevState: UploadState, formData: FormData) => Promise<UploadState>

export function AttachmentSection({
  attachments,
  canUpload,
  uploadFileAction,
  uploadLinkAction,
  deleteAction,
}: {
  attachments: AttachmentRow[]
  canUpload: boolean
  uploadFileAction: UploadAction
  uploadLinkAction: UploadAction
  deleteAction: (attachmentId: string) => Promise<void>
}) {
  const [fileState, fileFormAction, filePending] = useActionState<UploadState, FormData>(uploadFileAction, undefined)
  const [linkState, linkFormAction, linkPending] = useActionState<UploadState, FormData>(uploadLinkAction, undefined)
  const [deletePending, startDelete] = useTransition()

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Allegati</h2>
      <ul className="mb-3 space-y-2">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <div>
              {a.type === 'File' ? (
                <a href={`/api/attachments/${a.id}`} className="font-medium text-indigo-600 hover:underline">
                  {a.label}
                </a>
              ) : (
                <a href={a.url ?? '#'} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">
                  {a.label} ↗
                </a>
              )}
              <p className="text-xs text-slate-400">
                {a.uploaderName} · {formatDateTime(a.uploadedAt)}
              </p>
            </div>
            {a.canDelete && (
              <button
                type="button"
                disabled={deletePending}
                onClick={() => startDelete(() => deleteAction(a.id))}
                className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-60"
              >
                Elimina
              </button>
            )}
          </li>
        ))}
        {attachments.length === 0 && <p className="text-sm text-slate-400">Nessun allegato.</p>}
      </ul>
      {canUpload && (
        <div className="flex flex-wrap gap-4">
          <form action={fileFormAction} className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">File</label>
              <input name="file" type="file" required className="text-xs" />
            </div>
            <input name="label" placeholder="Etichetta (opzionale)" className="rounded border border-slate-300 px-2 py-1 text-xs" />
            <button type="submit" disabled={filePending} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60">
              Carica
            </button>
            {fileState?.error && <span className="text-xs text-red-600">{fileState.error}</span>}
          </form>
          <form action={linkFormAction} className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Link</label>
              <input name="url" type="url" placeholder="https://…" required className="rounded border border-slate-300 px-2 py-1 text-xs" />
            </div>
            <input name="label" placeholder="Etichetta (opzionale)" className="rounded border border-slate-300 px-2 py-1 text-xs" />
            <button type="submit" disabled={linkPending} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60">
              Aggiungi
            </button>
            {linkState?.error && <span className="text-xs text-red-600">{linkState.error}</span>}
          </form>
        </div>
      )}
    </section>
  )
}
