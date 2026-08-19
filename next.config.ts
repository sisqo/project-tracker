import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Attachments go through a Server Action multipart upload. Set to
      // Vercel's own platform ceiling (see MAX_ATTACHMENT_BYTES in
      // lib/blob.ts) — this can only lower Next's limit below that ceiling,
      // never raise it past it, so there's no point going higher.
      bodySizeLimit: '4.5mb',
    },
  },
}

export default nextConfig
