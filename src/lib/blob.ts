import { get, put } from '@vercel/blob'

/**
 * Vercel Functions hard-cap the request body at 4.5 MB, platform-wide and
 * regardless of Next's own `bodySizeLimit` — that setting can only lower
 * Next's threshold below the platform ceiling, never raise it past it. 4 MB
 * leaves headroom for multipart overhead (boundaries, the other form fields)
 * so a file right at the line doesn't trip Vercel's own 413 instead of this
 * app's validation message.
 */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024

export async function uploadAttachmentFile(file: File, prefix: string) {
  const blob = await put(`${prefix}/${file.name}`, file, {
    access: 'private',
    addRandomSuffix: true,
    contentType: file.type || 'application/octet-stream',
  })
  return blob
}

/**
 * The store was created with `--access private`, so its blobs aren't
 * fetchable by URL alone — only the server, holding `BLOB_READ_WRITE_TOKEN`,
 * can read them, via the SDK's own `get()` rather than a plain fetch.
 */
export async function fetchAttachmentBlob(url: string) {
  return get(url, { access: 'private' })
}
