type Option = { id: string; label: string }

export function ProjectFilterBar({
  owners,
  units,
  tags,
  current,
}: {
  owners: Option[]
  units: Option[]
  tags: Option[]
  current: Record<string, string | undefined>
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Stato</label>
        <select name="status" defaultValue={current.status ?? ''} className="rounded border border-slate-300 px-2 py-1">
          <option value="">Tutti</option>
          {['Draft', 'Active', 'OnHold', 'Completed', 'Cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Priorità</label>
        <select name="priority" defaultValue={current.priority ?? ''} className="rounded border border-slate-300 px-2 py-1">
          <option value="">Tutte</option>
          {['High', 'Medium', 'Low'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Owner</label>
        <select name="owner" defaultValue={current.owner ?? ''} className="rounded border border-slate-300 px-2 py-1">
          <option value="">Tutti</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Unità richiedente</label>
        <select name="unit" defaultValue={current.unit ?? ''} className="rounded border border-slate-300 px-2 py-1">
          <option value="">Tutte</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Tag</label>
        <select name="tag" defaultValue={current.tag ?? ''} className="rounded border border-slate-300 px-2 py-1">
          <option value="">Tutti</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Ordina per</label>
        <select name="sort" defaultValue={current.sort ?? ''} className="rounded border border-slate-300 px-2 py-1">
          <option value="">Più recenti</option>
          <option value="dueDate">Scadenza</option>
          <option value="priority">Priorità</option>
          <option value="name">Nome</option>
        </select>
      </div>
      <label className="flex items-center gap-1.5 pb-1.5">
        <input type="checkbox" name="overdue" value="1" defaultChecked={current.overdue === '1'} />
        Solo in ritardo
      </label>
      <label className="flex items-center gap-1.5 pb-1.5">
        <input type="checkbox" name="archived" value="1" defaultChecked={current.archived === '1'} />
        Includi archiviati
      </label>
      <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700">
        Filtra
      </button>
      <a
        href={`/projects/export?${new URLSearchParams(
          Object.fromEntries(Object.entries(current).filter((e): e is [string, string] => !!e[1])),
        ).toString()}`}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
      >
        Esporta CSV
      </a>
    </form>
  )
}
