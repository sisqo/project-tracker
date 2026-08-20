'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { searchAction } from './search-actions'
import type { SearchResults } from '@/lib/queries/search'

type Filter = 'all' | 'project' | 'task' | 'requester' | 'unit'

type FlatItem = {
  key: string
  type: Filter
  primary: string
  secondary: string
  href: string | null
}

const EMPTY: SearchResults = { projects: [], tasks: [], requesters: [], units: [] }

function flatten(results: SearchResults): FlatItem[] {
  return [
    ...results.projects.map((p) => ({
      key: `project-${p.id}`,
      type: 'project' as const,
      primary: p.name,
      secondary: `${p.code} · ${p.ownerFirstName} ${p.ownerLastName}`,
      href: `/projects/${p.id}`,
    })),
    ...results.tasks.map((t) => ({
      key: `task-${t.id}`,
      type: 'task' as const,
      primary: t.title,
      secondary: t.projectName,
      href: `/projects/${t.projectId}/tasks/${t.id}`,
    })),
    ...results.requesters.map((r) => ({
      key: `requester-${r.id}`,
      type: 'requester' as const,
      primary: `${r.firstName} ${r.lastName}`,
      secondary: r.unitName,
      href: null,
    })),
    ...results.units.map((u) => ({
      key: `unit-${u.id}`,
      type: 'unit' as const,
      primary: u.name,
      secondary: u.code,
      href: null,
    })),
  ]
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'project', label: 'Progetti' },
  { value: 'task', label: 'Task' },
  { value: 'requester', label: 'Richiedenti' },
  { value: 'unit', label: 'Unità' },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState(0)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(EMPTY)
      setFilter('all')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(EMPTY)
      return
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAction(trimmed)
        setResults(r)
        setSelected(0)
      })
    }, 150)
    return () => clearTimeout(handle)
  }, [query, open, startTransition])

  const flat = useMemo(() => flatten(results), [results])
  const visible = useMemo(() => (filter === 'all' ? flat : flat.filter((i) => i.type === filter)), [flat, filter])

  function go(item: FlatItem | undefined) {
    if (!item?.href) return
    router.push(item.href)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((i) => Math.min(i + 1, visible.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        go(visible[selected])
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visible, selected])

  if (!open) return null

  const counts: Record<Filter, number> = {
    all: flat.length,
    project: results.projects.length,
    task: results.tasks.length,
    requester: results.requesters.length,
    unit: results.units.length,
  }

  const sections = (
    [
      { type: 'project', label: 'Progetti' },
      { type: 'task', label: 'Task' },
      { type: 'requester', label: 'Richiedenti' },
      { type: 'unit', label: 'Unità organizzative' },
    ] as const
  )
    .map((s) => ({ ...s, items: visible.filter((i) => i.type === s.type) }))
    .filter((s) => s.items.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-pt-ink/20 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-pt-lineStrong bg-pt-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-pt-line px-4 py-3.5">
          <span className="inline-block h-[13px] w-[13px] rounded-full border-[1.5px] border-pt-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca progetti, task, richiedenti, unità…"
            className="flex-1 border-none text-[15px] text-pt-ink outline-none placeholder:text-pt-ghost"
          />
          <span className="font-mono text-[11px] text-pt-whisper">esc</span>
        </div>

        {query.trim() && (
          <div className="flex gap-1.5 border-b border-pt-line px-4 py-2.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-2.5 py-[3px] text-xs ${
                  filter === f.value ? 'bg-pt-accentSoft text-pt-accent' : counts[f.value] > 0 ? 'text-pt-muted hover:bg-pt-shell' : 'text-pt-whisper'
                }`}
              >
                {f.label} {counts[f.value]}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[360px] overflow-y-auto py-2">
          {!query.trim() && <p className="px-4 py-6 text-center text-sm text-pt-ghost">Inizia a digitare per cercare.</p>}
          {query.trim() && visible.length === 0 && <p className="px-4 py-6 text-center text-sm text-pt-ghost">Nessun risultato.</p>}
          {sections.map((section) => (
            <div key={section.type}>
              <div className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-pt-ghost">{section.label}</div>
              {section.items.map((item) => {
                const index = visible.indexOf(item)
                const active = index === selected
                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => go(item)}
                    className={`flex cursor-pointer items-center gap-2.5 px-4 py-2 ${active ? 'bg-pt-accentSoft/40' : ''} ${item.href ? '' : 'cursor-default opacity-70'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-pt-ink">{item.primary}</div>
                      <div className="truncate font-mono text-[11.5px] text-pt-subtle">{item.secondary}</div>
                    </div>
                    {active && item.href && <span className="font-mono text-[11px] text-pt-whisper">↵</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex gap-4 border-t border-pt-line px-4 py-2.5 font-mono text-[11px] text-pt-ghost">
          <span>↑↓ naviga</span>
          <span>↵ apri</span>
          <span>esc chiudi</span>
        </div>
      </div>
    </div>
  )
}
