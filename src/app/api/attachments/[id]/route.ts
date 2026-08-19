import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/current-user'
import { fetchAttachmentBlob } from '@/lib/blob'
import { db } from '@/lib/db/client'
import { attachments } from '@/lib/db/schema'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const [attachment] = await db().select().from(attachments).where(eq(attachments.id, id)).limit(1)
  if (!attachment || attachment.type !== 'File' || !attachment.fileRef) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const result = await fetchAttachmentBlob(attachment.fileRef)
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: 'Impossibile scaricare il file' }, { status: 502 })
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${attachment.label.replace(/"/g, '')}"`,
    },
  })
}
