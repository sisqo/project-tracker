const PALETTE = [
  { bg: 'bg-pt-accentSoft', text: 'text-pt-accent' },
  { bg: 'bg-pt-tan', text: 'text-pt-tanText' },
  { bg: 'bg-pt-sage', text: 'text-pt-sageText' },
  { bg: 'bg-pt-sky', text: 'text-pt-skyText' },
  { bg: 'bg-pt-violet', text: 'text-pt-violetText' },
]

function hashToIndex(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash % PALETTE.length
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-5 w-5 text-[9.5px]',
  md: 'h-6 w-6 text-[10px]',
  lg: 'h-7 w-7 text-[10.5px]',
}

export function Avatar({
  id,
  firstName,
  lastName,
  size = 'md',
  className = '',
}: {
  id: string
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { bg, text } = PALETTE[hashToIndex(id)]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZE_CLASSES[size]} ${bg} ${text} ${className}`}
    >
      {initials(firstName, lastName)}
    </span>
  )
}

export function UnassignedAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-pt-dashed text-pt-ghost ${SIZE_CLASSES[size]}`}
    >
      ?
    </span>
  )
}
