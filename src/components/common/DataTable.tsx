import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { LabelWithInfo } from './FieldInfo'

export type Column<T = any> = {
  key: string
  label: ReactNode
  align?: 'left' | 'right' | 'center'
  /** Chiều rộng gợi ý — dùng px hoặc % */
  width?: string
  /** Chiều rộng tối thiểu, giữ cột không bị bóp méo khi bảng chật */
  min?: number
  nowrap?: boolean
  /** Mã trường trong từ điển trường thông tin — hiện dấu ⓘ giải thích nguồn gốc */
  info?: string
  render?: (row: T, index: number) => ReactNode
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  onRowClick,
  rowKey,
  empty = 'Không có dữ liệu phù hợp',
  dense,
  maxHeight,
  highlightRow,
  stt,
}: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  rowKey?: (row: T, i: number) => string
  empty?: string
  dense?: boolean
  maxHeight?: number
  highlightRow?: (row: T) => 'bad' | 'warn' | 'ok' | undefined
  /** Hiện cột số thứ tự bản ghi ở đầu bảng */
  stt?: boolean
}) {
  if (!rows.length) return <EmptyState text={empty} />

  const raw: Column<T>[] = stt
    ? [{ key: '__stt', label: '#', align: 'right', width: '44px', min: 44, nowrap: true, render: (_r, i) => <span className="mono text-[11px] text-slate-400">{i + 1}</span> }, ...columns]
    : columns

  /**
   * Bề rộng tối thiểu mặc định — giữ cột không bị bóp méo khi bảng có nhiều cột.
   * Cột chữ dài cần rộng hơn cột số và cột chip.
   */
  const cols: Column<T>[] = raw.map(c => ({
    ...c,
    min: c.min ?? (c.key === '__stt' || c.key === 'act' ? undefined : c.align === 'right' || c.align === 'center' ? 96 : 128),
  }))

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table className="w-full border-collapse text-[12.5px]">
        <colgroup>
          {cols.map(c => (
            <col key={c.key} style={{ width: c.width, minWidth: c.min ? `${c.min}px` : undefined }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            {cols.map(c => (
              <th
                key={c.key}
                style={{ minWidth: c.min }}
                className={cn(
                  'border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-slate-500',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                  !c.align && 'text-left'
                )}
              >
                <LabelWithInfo info={c.info}>{c.label}</LabelWithInfo>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const hl = highlightRow?.(row)
            return (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-slate-100 last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer',
                  hl === 'bad' ? 'bg-red-50/50 hover:bg-red-50'
                    : hl === 'warn' ? 'bg-amber-50/40 hover:bg-amber-50'
                    : hl === 'ok' ? 'bg-emerald-50/40 hover:bg-emerald-50'
                    : 'hover:bg-slate-50'
                )}
              >
                {cols.map(c => (
                  <td
                    key={c.key}
                    style={{ minWidth: c.min }}
                    className={cn(
                      dense ? 'px-3 py-1.5' : 'px-3 py-2.5',
                      'align-middle text-slate-700',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.nowrap && 'whitespace-nowrap'
                    )}
                  >
                    {c.render ? c.render(row, i) : (row as any)[c.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({ text = 'Không có dữ liệu phù hợp', action }: { text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 py-12 text-center">
      <Inbox className="h-8 w-8 text-slate-300" />
      <div className="text-[13px] text-slate-500">{text}</div>
      {action}
    </div>
  )
}

/** Ô đầu bảng: tên chính + dòng mô tả mờ bên dưới */
export function CellTitle({
  title,
  sub,
  mono,
  warn,
}: {
  title: ReactNode
  sub?: ReactNode
  mono?: boolean
  warn?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className={cn('font-semibold leading-snug text-slate-800', mono && 'mono text-[12px]')}>{title}</div>
      {sub && <div className="mt-0.5 text-[11.5px] leading-snug text-slate-400">{sub}</div>}
      {warn && <div className="mt-0.5 text-[11px] font-medium leading-snug text-red-600">{warn}</div>}
    </div>
  )
}

/** Ô hai dòng: giá trị chính + nhãn phụ — dùng để gộp cột, giảm số cột trên bảng */
export function CellStack({ top, bottom, tone }: { top: ReactNode; bottom?: ReactNode; tone?: 'muted' | 'danger' }) {
  return (
    <div className="min-w-0 leading-snug">
      <div className={cn('text-[12.5px]', tone === 'danger' ? 'font-semibold text-red-600' : 'text-slate-700')}>{top}</div>
      {bottom !== undefined && bottom !== null && bottom !== '' && (
        <div className="mt-0.5 text-[10.5px] text-slate-400">{bottom}</div>
      )}
    </div>
  )
}
