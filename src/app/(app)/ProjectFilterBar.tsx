'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { ProjectListCounts, ProjectTab } from '@/lib/queries/projects'

type Option = { id: string; label: string }

const TABS: { value: ProjectTab; label: string; countKey: keyof ProjectListCounts }[] = [
  { value: 'all', label: 'Tutti', countKey: 'all' },
  { value: 'active', label: 'Attivi', countKey: 'active' },
  { value: 'overdue', label: 'In ritardo', countKey: 'overdue' },
  { value: 'mine', label: 'Miei', countKey: 'mine' },
  { value: 'archived', label: 'Archiviati', countKey: 'archived' },
]

const STATUSES = [
  { value: 'Draft', label: 'Bozza' },
  { value: 'Active', label: 'Attivo' },
  { value: 'OnHold', label: 'In pausa' },
  { value: 'Completed', label: 'Completato' },
  { value: 'Cancelled', label: 'Annullato' },
]

export function ProjectFilterBar({
  owners,
  units,
  tags,
  current,
  tab,
  counts,
}: {
  owners: Option[]
  units: Option[]
  tags: Option[]
  current: Record<string, string | undefined>
  tab: ProjectTab
  counts: ProjectListCounts
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 border-b border-pt-line">
        {TABS.map((t) => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setParam('tab', t.value === 'all' ? null : t.value)}
              className={`mr-3.5 pb-2.5 pt-1.5 text-[13.5px] ${
                active ? 'font-medium text-pt-accent shadow-[inset_0_-2px_0_theme(colors.pt.accent)]' : 'text-pt-muted hover:text-pt-ink'
              }`}
            >
              {t.label} <span className={active ? 'text-pt-accentText' : 'text-pt-ghost'}>{counts[t.countKey]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Stato" value={current.status} onChange={(v) => setParam('status', v)} options={STATUSES.map((s) => ({ id: s.value, label: s.label }))} allLabel="tutti" />
        <FilterSelect label="Priorità" value={current.priority} onChange={(v) => setParam('priority', v)} options={[{ id: 'High', label: 'Alta' }, { id: 'Medium', label: 'Media' }, { id: 'Low', label: 'Bassa' }]} allLabel="tutte" />
        <FilterSelect label="Owner" value={current.owner} onChange={(v) => setParam('owner', v)} options={owners} allLabel="tutti" />
        <FilterSelect label="Unità" value={current.unit} onChange={(v) => setParam('unit', v)} options={units} allLabel="tutte" />
        <FilterSelect label="Tag" value={current.tag} onChange={(v) => setParam('tag', v)} options={tags} allLabel="tutti" />

        <label className="flex items-center gap-1.5 text-[12.5px] text-pt-muted">
          <input
            type="checkbox"
            checked={current.archived === '1'}
            onChange={(e) => setParam('archived', e.target.checked ? '1' : null)}
          />
          Includi archiviati
        </label>

        <div className="ml-auto flex items-center gap-3">
          <select
            value={current.sort ?? ''}
            onChange={(e) => setParam('sort', e.target.value || null)}
            className="border-none bg-transparent text-[12.5px] text-pt-faint focus:outline-none"
          >
            <option value="">Ordina per: più recenti</option>
            <option value="dueDate">Ordina per: scadenza</option>
            <option value="priority">Ordina per: priorità</option>
            <option value="name">Ordina per: nome</option>
          </select>
          <a
            href={`/projects/export?${new URLSearchParams(
              Object.fromEntries(Object.entries(current).filter((e): e is [string, string] => !!e[1])),
            ).toString()}`}
            className="rounded-md border border-pt-lineStrong bg-pt-surface px-3 py-[7px] text-[13px] text-pt-soft hover:bg-pt-shell"
          >
            Esporta CSV
          </a>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string | undefined
  onChange: (value: string | null) => void
  options: Option[]
  allLabel: string
}) {
  const active = Boolean(value)
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`rounded-full border px-2.5 py-[5px] text-[12.5px] ${
        active ? 'border-pt-accentBorder bg-pt-accentSoft text-pt-accent' : 'border-pt-lineStrong bg-pt-surface text-pt-soft'
      }`}
    >
      <option value="">
        {label}: {allLabel}
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
