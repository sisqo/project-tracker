const PROJECT_STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-pt-shell text-pt-muted',
  Active: 'bg-pt-goodSoft text-pt-good',
  OnHold: 'bg-pt-warnSoft text-pt-warn',
  Completed: 'bg-pt-infoSoft text-pt-info',
  Cancelled: 'bg-pt-dangerSoft text-pt-danger',
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  Draft: 'Bozza',
  Active: 'Attivo',
  OnHold: 'In pausa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

const TASK_STATUS_STYLES: Record<string, string> = {
  Todo: 'bg-pt-shell text-pt-muted',
  InProgress: 'bg-pt-accentSoft text-pt-accent',
  Waiting: 'bg-pt-warnSoft text-pt-warn',
  Completed: 'bg-pt-infoSoft text-pt-info',
  Cancelled: 'bg-pt-dangerSoft text-pt-danger',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  Todo: 'Da fare',
  InProgress: 'In corso',
  Waiting: 'In attesa',
  Completed: 'Completato',
  Cancelled: 'Annullato',
}

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-pt-dangerSoft text-pt-danger',
  Medium: 'bg-pt-warnSoft text-pt-warn',
  Low: 'bg-pt-shell text-pt-muted',
}

const PRIORITY_LABELS: Record<string, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Bassa',
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${className}`}>
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
  return <Pill className="bg-pt-overdue text-white">In ritardo</Pill>
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Pill className="bg-pt-goodSoft text-pt-good">Attivo</Pill>
  ) : (
    <Pill className="bg-pt-shell text-pt-muted">Disattivato</Pill>
  )
}
