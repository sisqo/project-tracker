import { eq, or, sql } from 'drizzle-orm'
import Link from 'next/link'
import React from 'react'

import { requireUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { organizationalUnits, projects, requesters, tasks } from '@/lib/db/schema'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser()
  const { q } = await searchParams
  const query = (q ?? '').trim()

  let projectResults: { id: string; name: string; code: string }[] = []
  let taskResults: { id: string; title: string; projectId: string; projectName: string }[] = []
  let requesterResults: { id: string; firstName: string; lastName: string; unitName: string }[] = []
  let unitResults: { id: string; code: string; name: string }[] = []

  if (query) {
    const like = `%${query}%`

    projectResults = await db()
      .select({ id: projects.id, name: projects.name, code: projects.code })
      .from(projects)
      .where(or(sql`${projects.name} ilike ${like}`, sql`${projects.code} ilike ${like}`))
      .limit(20)

    taskResults = await db()
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId, projectName: projects.name })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(sql`${tasks.title} ilike ${like}`)
      .limit(20)

    requesterResults = await db()
      .select({
        id: requesters.id,
        firstName: requesters.firstName,
        lastName: requesters.lastName,
        unitName: organizationalUnits.name,
      })
      .from(requesters)
      .innerJoin(organizationalUnits, eq(requesters.unitId, organizationalUnits.id))
      .where(or(sql`${requesters.firstName} ilike ${like}`, sql`${requesters.lastName} ilike ${like}`, sql`${requesters.email} ilike ${like}`))
      .limit(20)

    unitResults = await db()
      .select()
      .from(organizationalUnits)
      .where(or(sql`${organizationalUnits.name} ilike ${like}`, sql`${organizationalUnits.code} ilike ${like}`))
      .limit(20)
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Ricerca globale</h1>
      <form method="get" className="mb-6">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Cerca progetti, task, richiedenti, unità…"
          className="w-full max-w-lg rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </form>

      {query && (
        <div className="flex flex-col gap-6">
          <ResultSection title="Progetti">
            {projectResults.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block rounded border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                {p.name} <span className="text-xs text-slate-400">({p.code})</span>
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Task">
            {taskResults.map((t) => (
              <Link key={t.id} href={`/projects/${t.projectId}/tasks/${t.id}`} className="block rounded border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                {t.title} <span className="text-xs text-slate-400">({t.projectName})</span>
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Richiedenti">
            {requesterResults.map((r) => (
              <div key={r.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
                {r.firstName} {r.lastName} <span className="text-xs text-slate-400">({r.unitName})</span>
              </div>
            ))}
          </ResultSection>
          <ResultSection title="Unità organizzative">
            {unitResults.map((u) => (
              <div key={u.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
                {u.code} — {u.name}
              </div>
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  )
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children)
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-900">
        {title} <span className="text-slate-400">({items.length})</span>
      </h2>
      <div className="flex flex-col gap-1">{items.length > 0 ? items : <p className="text-sm text-slate-400">Nessun risultato.</p>}</div>
    </section>
  )
}
