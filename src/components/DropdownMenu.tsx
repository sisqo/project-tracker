'use client'

import { useEffect, useRef, useState } from 'react'

export function DropdownMenu({
  label = '···',
  align = 'end',
  children,
}: {
  label?: string
  align?: 'start' | 'end'
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-pt-lineStrong bg-pt-surface px-2.5 py-1.5 text-sm text-pt-soft hover:bg-pt-shell"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-20 mt-1 min-w-[180px] rounded-md border border-pt-line bg-pt-surface py-1 shadow-lg ${align === 'end' ? 'right-0' : 'left-0'}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  className = '',
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={`px-3 py-1.5 text-sm text-pt-soft hover:bg-pt-shell ${className}`} {...props}>
      {children}
    </div>
  )
}
