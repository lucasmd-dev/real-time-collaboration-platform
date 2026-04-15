import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-[rgba(24,18,12,0.42)] backdrop-blur-sm" onClick={onClose} />
      <div className="surface-panel motion-rise relative z-10 w-full max-w-lg rounded-[28px] p-6 sm:p-7">
        <h2 className="font-display text-2xl leading-none tracking-[-0.04em] text-zinc-950">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}
