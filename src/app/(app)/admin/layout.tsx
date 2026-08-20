import { requireAdmin } from '@/lib/auth/current-user'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  // Navigation between Utenti/Richiedenti/Unità/Tag lives in the sidebar's
  // "Anagrafiche" section now, so this layout is just an auth gate.
  return <>{children}</>
}
