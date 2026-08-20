'use server'

import { requireUser } from '@/lib/auth/current-user'
import { searchAll } from '@/lib/queries/search'

export async function searchAction(query: string) {
  await requireUser()
  return searchAll(query)
}
