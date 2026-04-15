import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-semibold tracking-[-0.02em] text-zinc-700">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400',
        'border-stone-300/80 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm',
        'focus:border-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-900/10',
        'disabled:bg-stone-100/70 disabled:opacity-50',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))

Input.displayName = 'Input'
