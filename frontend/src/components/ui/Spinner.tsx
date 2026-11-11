import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return <Loader2 className={cn('animate-spin text-blue-400', sizes[size], className)} />
}

interface LoadingScreenProps { message?: string }
export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center glow-blue animate-pulse-slow">
          <span className="text-2xl">🤖</span>
        </div>
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}
