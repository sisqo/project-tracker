import { requireUser } from '@/lib/auth/current-user'
import { getSidebarCounts } from '@/lib/queries/sidebar'

import { AppShell } from './AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const { projectCount, myOpenTaskCount } = await getSidebarCounts(user.id)

  return (
    <AppShell user={user} projectCount={projectCount} myOpenTaskCount={myOpenTaskCount}>
      {children}
    </AppShell>
  )
}
