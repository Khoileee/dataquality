import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** 6 kiểu nhãn tròn theo hệ thống thiết kế DMP */
export type Tone = 'b' | 'g' | 'r' | 'o' | 'n' | 't' | 'p'

const TONES: Record<Tone, string> = {
  b: 'bg-blue-50 text-blue-700 border-blue-100',
  g: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  r: 'bg-red-50 text-red-700 border-red-100',
  o: 'bg-amber-50 text-amber-700 border-amber-100',
  n: 'bg-slate-100 text-slate-600 border-slate-200',
  t: 'bg-teal-50 text-teal-700 border-teal-100',
  p: 'bg-violet-50 text-violet-700 border-violet-100',
}

export function Chip({
  tone = 'n',
  children,
  className,
  title,
  onClick,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  title?: string
  onClick?: () => void
}) {
  return (
    <span
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[1px] text-[11px] font-semibold leading-5',
        TONES[tone],
        onClick && 'cursor-pointer hover:brightness-95',
        className
      )}
    >
      {children}
    </span>
  )
}

/** Chấm tròn màu + chữ — dùng trong bảng khi cần gọn hơn chip */
export function Dot({ tone = 'n', children }: { tone?: Tone; children: ReactNode }) {
  const color: Record<Tone, string> = {
    b: 'bg-blue-500', g: 'bg-emerald-500', r: 'bg-red-500',
    o: 'bg-amber-500', n: 'bg-slate-400', t: 'bg-teal-500', p: 'bg-violet-500',
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px]">
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', color[tone])} />
      {children}
    </span>
  )
}

/* ─── Bộ ánh xạ trạng thái dùng chung toàn hệ thống ─── */

export const STATUS_TONE: Record<string, Tone> = {
  // vòng đời metadata (GĐ2 mục 8.1)
  'Dự thảo': 'n',
  'Chờ phê duyệt': 'o',
  'Yêu cầu chỉnh sửa': 'r',
  'Đã phê duyệt': 'g',
  'Ngừng sử dụng': 'n',
  // vòng đời đối tượng
  'Đang dùng': 'g',
  'Sắp ngừng': 'o',
  'Đã ngừng': 'n',
  'Nháp': 'n',
  // kết quả
  'Đạt': 'g',
  'Không đạt': 'r',
  'Cảnh báo': 'o',
  'Thành công': 'g',
  'Thất bại': 'r',
  'Đang chạy': 'b',
  'Chờ chạy': 'n',
  'Bị chặn': 'r',
  // sự cố
  'Mới': 'b',
  'Đã gán': 'b',
  'Đang xử lý': 'o',
  'Chờ kiểm tra lại': 'p',
  'Chờ duyệt đóng': 'o',
  'Đã giải quyết': 'g',
  'Đã đóng': 'n',
  // yêu cầu quyền
  'Đã phê duyệt – đang hiệu lực': 'g',
  'Từ chối': 'r',
  'Đã thu hồi': 'n',
  'Hết hạn': 'n',
  // mức độ
  'Nghiêm trọng': 'r',
  'Cao': 'r',
  'Trung bình': 'o',
  'Thấp': 'n',
  // phân loại (GĐ4 mục 3)
  'Công khai': 'g',
  'Nội bộ': 'b',
  'Mật': 'o',
  'Hạn chế truy cập': 'r',
  // MDM
  'Chưa xem xét': 'b',
  'Đang xem xét': 'o',
  'Đã hợp nhất': 'g',
  'Từ chối hợp nhất': 'n',
}

export function StatusChip({ value, className }: { value: string; className?: string }) {
  return <Chip tone={STATUS_TONE[value] ?? 'n'} className={className}>{value}</Chip>
}

export const TIER_TONE: Record<string, Tone> = { 'Tier 1': 'r', 'Tier 2': 'o', 'Tier 3': 'n' }

export function TierChip({ tier }: { tier: string | null }) {
  if (!tier) return <Chip tone="r" title="Chưa gán mức quan trọng">— chưa gán</Chip>
  return <Chip tone={TIER_TONE[tier] ?? 'n'}>{tier}</Chip>
}

/** 6 chiều chất lượng dữ liệu — GĐ3 mục 3 */
export const DIMENSIONS = [
  { id: 'completeness', label: 'Đầy đủ', en: 'Completeness' },
  { id: 'validity', label: 'Hợp lệ', en: 'Validity' },
  { id: 'consistency', label: 'Nhất quán', en: 'Consistency' },
  { id: 'uniqueness', label: 'Không trùng lặp', en: 'Uniqueness' },
  { id: 'accuracy', label: 'Chính xác', en: 'Accuracy' },
  { id: 'timeliness', label: 'Kịp thời', en: 'Timeliness' },
] as const

export type DimensionId = typeof DIMENSIONS[number]['id']

const DIM_TONE: Record<string, Tone> = {
  completeness: 'b', validity: 'p', consistency: 't',
  uniqueness: 'o', accuracy: 'g', timeliness: 'r',
}

export function DimensionChip({ id }: { id: string }) {
  const d = DIMENSIONS.find(x => x.id === id)
  return <Chip tone={DIM_TONE[id] ?? 'n'} title={d?.en}>{d?.label ?? id}</Chip>
}
