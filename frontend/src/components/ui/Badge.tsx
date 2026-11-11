import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variants = {
  default: 'bg-gray-800 text-gray-300 border-gray-700',
  success: 'bg-green-900/40 text-green-300 border-green-800',
  warning: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  danger: 'bg-red-900/40 text-red-300 border-red-800',
  info: 'bg-blue-900/40 text-blue-300 border-blue-800',
  purple: 'bg-purple-900/40 text-purple-300 border-purple-800',
}

const dotColors = {
  default: 'bg-gray-400',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  purple: 'bg-purple-400',
}

export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 border rounded-full font-medium',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  )
}
