import type { QualityDimension } from '@/types'
import { cn } from '@/lib/utils'

export const DIMENSION_CONFIG: Record<QualityDimension, { label: string; color: string; bg: string; border: string; hex: string }> = {
  completeness: { label: 'Đầy đủ', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', hex: '#3b82f6' },
  validity: { label: 'Hợp lệ', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', hex: '#8b5cf6' },
  consistency: { label: 'Nhất quán', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', hex: '#06b6d4' },
  uniqueness: { label: 'Duy nhất', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', hex: '#f59e0b' },
  accuracy: { label: 'Chính xác', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', hex: '#10b981' },
  timeliness: { label: 'Kịp thời', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', hex: '#f97316' },
}

export function DimensionBadge({ dimension }: { dimension: QualityDimension }) {
  const c = DIMENSION_CONFIG[dimension]
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium', c.color, c.bg, c.border)}>
      {c.label}
    </span>
  )
}

export function getDimensionLabel(d: QualityDimension) { return DIMENSION_CONFIG[d]?.label ?? d }
export function getDimensionColor(d: QualityDimension) { return DIMENSION_CONFIG[d]?.hex ?? '#6b7280' }
