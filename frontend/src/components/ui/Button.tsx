import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px'
  const variants = {
    primary: 'border-sky-900 bg-sky-900 text-white shadow-[0_24px_48px_-28px_rgba(12,67,88,0.8)] hover:border-sky-800 hover:bg-sky-800 focus:ring-sky-900',
    ghost: 'border-transparent bg-white/55 text-zinc-700 hover:border-stone-200 hover:bg-white focus:ring-stone-300',
    danger: 'border-red-700 bg-red-700 text-white shadow-[0_20px_40px_-26px_rgba(153,45,36,0.8)] hover:bg-red-800 hover:border-red-800 focus:ring-red-700',
  }
  const sizes = {
    sm: 'min-h-9 gap-1.5 px-3.5 py-2',
    md: 'min-h-11 gap-2 px-5 py-2.5',
  }

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
