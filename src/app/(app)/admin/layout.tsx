import Link from 'next/link'

import { requireAdmin } from '@/lib/auth/current-user'

const TABS = [
  { href: '/admin/users', label: 'Utenti' },
  { href: '/admin/requesters', label: 'Richiedenti' },
  { href: '/admin/units', label: 'Unità organizzative' },
  { href: '/admin/tags', label: 'Tag' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Anagrafiche</h1>
      <nav className="mb-6 flex gap-4 border-b border-slate-200 text-sm">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className="px-1 pb-2 text-slate-600 hover:text-slate-900">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
