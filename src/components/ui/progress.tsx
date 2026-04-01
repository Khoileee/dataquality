import { cn } from '@/lib/utils'
export function Progress({ value = 0, className, colorClass }: { value?: number; className?: string; colorClass?: string }) {
  const auto = colorClass || (value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500')
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-gray-200', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', auto)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
