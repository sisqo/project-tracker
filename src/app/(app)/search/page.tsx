import Link from 'next/link'
import React from 'react'

import { requireUser } from '@/lib/auth/current-user'
import { searchAll } from '@/lib/queries/search'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser()
  const { q } = await searchParams
  const query = (q ?? '').trim()

  const results = query ? await searchAll(query) : { projects: [], tasks: [], requesters: [], units: [] }

  return (
    <div>
      <h1 className="mb-4 font-serif text-[26px] font-medium text-pt-ink">Ricerca globale</h1>
      <form method="get" className="mb-6">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Cerca progetti, task, richiedenti, unità…"
          className="w-full max-w-lg rounded-md border border-pt-lineStrong px-3 py-2 text-sm"
        />
      </form>

      {query && (
        <div className="flex flex-col gap-6">
          <ResultSection title="Progetti">
            {results.projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block rounded border border-pt-line bg-pt-surface px-3 py-2 text-sm hover:bg-pt-surfaceSoft">
                {p.name} <span className="text-xs text-pt-ghost">({p.code})</span>
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Task">
            {results.tasks.map((t) => (
              <Link key={t.id} href={`/projects/${t.projectId}/tasks/${t.id}`} className="block rounded border border-pt-line bg-pt-surface px-3 py-2 text-sm hover:bg-pt-surfaceSoft">
                {t.title} <span className="text-xs text-pt-ghost">({t.projectName})</span>
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Richiedenti">
            {results.requesters.map((r) => (
              <div key={r.id} className="rounded border border-pt-line bg-pt-surface px-3 py-2 text-sm">
                {r.firstName} {r.lastName} <span className="text-xs text-pt-ghost">({r.unitName})</span>
              </div>
            ))}
          </ResultSection>
          <ResultSection title="Unità organizzative">
            {results.units.map((u) => (
              <div key={u.id} className="rounded border border-pt-line bg-pt-surface px-3 py-2 text-sm">
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
      <h2 className="mb-2 text-sm font-semibold text-pt-ink">
        {title} <span className="text-pt-ghost">({items.length})</span>
      </h2>
      <div className="flex flex-col gap-1">{items.length > 0 ? items : <p className="text-sm text-pt-ghost">Nessun risultato.</p>}</div>
    </section>
  )
}
