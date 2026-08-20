export function ProgressBar({
  percent,
  tone = 'accent',
  className = '',
}: {
  percent: number
  tone?: 'accent' | 'muted' | 'info'
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const fill = tone === 'info' ? 'bg-pt-info' : tone === 'muted' ? 'bg-pt-ghost' : 'bg-pt-accent'
  return (
    <div className={`h-[5px] flex-1 overflow-hidden rounded-full bg-pt-line ${className}`}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}
