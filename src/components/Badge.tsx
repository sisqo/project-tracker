const PROJECT_STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  OnHold: 'bg-amber-100 text-amber-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  Draft: 'Bozza',
  Active: 'Attivo',
  OnHold: 'In pausa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

const TASK_STATUS_STYLES: Record<string, string> = {
  Todo: 'bg-slate-100 text-slate-700',
  InProgress: 'bg-indigo-100 text-indigo-700',
  Waiting: 'bg-amber-100 text-amber-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  Todo: 'Da fare',
  InProgress: 'In corso',
  Waiting: 'In attesa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-rose-100 text-rose-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
}

const PRIORITY_LABELS: Record<string, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Bassa',
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return <Pill className={PROJECT_STATUS_STYLES[status] ?? ''}>{PROJECT_STATUS_LABELS[status] ?? status}</Pill>
}

export function TaskStatusBadge({ status }: { status: string }) {
  return <Pill className={TASK_STATUS_STYLES[status] ?? ''}>{TASK_STATUS_LABELS[status] ?? status}</Pill>
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Pill className={PRIORITY_STYLES[priority] ?? ''}>{PRIORITY_LABELS[priority] ?? priority}</Pill>
}

export function OverdueBadge() {
  return <Pill className="bg-rose-600 text-white">In ritardo</Pill>
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Pill className="bg-emerald-100 text-emerald-700">Attivo</Pill>
  ) : (
    <Pill className="bg-slate-200 text-slate-600">Disattivato</Pill>
  )
}
