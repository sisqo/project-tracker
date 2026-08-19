import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Project Tracker',
  description: 'Gestione progetti interna',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
