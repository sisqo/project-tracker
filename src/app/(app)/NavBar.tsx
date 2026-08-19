import Link from 'next/link'

import { logoutAction } from './actions'
import type { CurrentUser } from '@/lib/auth/current-user'

export function NavBar({ user }: { user: CurrentUser }) {
  const links = [
    { href: '/', label: 'Progetti' },
    { href: '/my-tasks', label: 'I miei task' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/search', label: 'Ricerca' },
  ]
  if (user.role === 'Administrator') {
    links.push({ href: '/admin', label: 'Anagrafiche' })
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-slate-900">
            Project Tracker
          </Link>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {user.firstName} {user.lastName}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="text-slate-500 hover:text-slate-900">
              Esci
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
