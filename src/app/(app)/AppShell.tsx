'use client'

import { useEffect, useState } from 'react'

import type { CurrentUser } from '@/lib/auth/current-user'

import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'

export function AppShell({
  user,
  projectCount,
  myOpenTaskCount,
  children,
}: {
  user: CurrentUser
  projectCount: number
  myOpenTaskCount: number
  children: React.ReactNode
}) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} projectCount={projectCount} myOpenTaskCount={myOpenTaskCount} onOpenSearch={() => setPaletteOpen(true)} />
      <main className="min-w-0 flex-1 overflow-x-auto px-8 py-7">{children}</main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
