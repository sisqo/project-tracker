'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Avatar } from '@/components/Avatar'
import type { CurrentUser } from '@/lib/auth/current-user'

import { logoutAction } from './actions'

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'Utenti' },
  { href: '/admin/requesters', label: 'Richiedenti' },
  { href: '/admin/units', label: 'Unità organizzative' },
  { href: '/admin/tags', label: 'Tag' },
]

export function Sidebar({
  user,
  projectCount,
  myOpenTaskCount,
  onOpenSearch,
}: {
  user: CurrentUser
  projectCount: number
  myOpenTaskCount: number
  onOpenSearch: () => void
}) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Progetti', count: projectCount },
    { href: '/my-tasks', label: 'I miei task', count: myOpenTaskCount },
    { href: '/dashboard', label: 'Dashboard', count: null },
  ]

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-pt-line bg-pt-shell py-5">
      <div className="flex items-center gap-2.5 px-5 pb-[22px]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] bg-pt-accent font-serif text-[15px] text-white">
          P
        </span>
        <span className="font-serif text-[19px] text-pt-ink">Project Tracker</span>
      </div>

      <div className="px-3.5 pb-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-[5px] border border-pt-lineStrong bg-pt-surface px-2.5 py-[7px] text-left text-[13px] text-pt-subtle hover:border-pt-ghost"
        >
          <span className="inline-block h-3 w-3 rounded-full border-[1.5px] border-pt-subtle" />
          Cerca progetti, task…
          <span className="ml-auto font-mono text-[11px] text-pt-whisper">⌘K</span>
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-[5px] px-3 py-2 text-sm ${
                active ? 'bg-pt-accentSoft font-medium text-pt-accent' : 'text-pt-soft hover:bg-pt-line/60'
              }`}
            >
              {link.label}
              {link.count !== null && (
                <span className={`ml-auto font-mono text-[11px] ${active ? 'text-pt-accentText' : 'text-pt-subtle'}`}>
                  {link.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {user.role === 'Administrator' && (
        <>
          <div className="px-6 pb-2 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-pt-ghost">Anagrafiche</div>
          <nav className="flex flex-col gap-0.5 px-3">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-[5px] px-3 py-[7px] text-sm ${
                  isActive(link.href) ? 'bg-pt-accentSoft font-medium text-pt-accent' : 'text-pt-soft hover:bg-pt-line/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto flex items-center gap-2.5 border-t border-pt-line px-5 pt-4">
        <Avatar id={user.id} firstName={user.firstName} lastName={user.lastName} size="lg" />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] text-pt-ink">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-[11px] text-pt-subtle">{user.role === 'Administrator' ? 'Amministratore' : 'Utente'}</div>
        </div>
        <form action={logoutAction} className="ml-auto">
          <button type="submit" className="text-xs text-pt-subtle hover:text-pt-ink">
            Esci
          </button>
        </form>
      </div>
    </aside>
  )
}
