import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { fieldOf, ORIGIN_LABEL, ORIGIN_TONE, type FieldDef } from '@/data/fieldMeta'
import { Chip } from './Chip'

/**
 * Dấu ⓘ đặt cạnh nhãn trường. Trỏ chuột vào hiện thẻ giải thích hai chiều:
 *   ← Giá trị này từ đâu ra
 *   → Khai xong dùng ở đâu
 */
export function FieldInfo({ k, className }: { k: string; className?: string }) {
  const def = fieldOf(k)
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; above: boolean } | null>(null)

  if (!def) return null

  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const above = r.top > window.innerHeight * 0.55
    setPos({ x: Math.min(r.left, window.innerWidth - 440), y: above ? r.top - 8 : r.bottom + 8, above })
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        className={cn(
          'ml-1 inline-flex h-[13px] w-[13px] shrink-0 cursor-help select-none items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold leading-none text-slate-400 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600',
          className
        )}
      >
        i
      </span>
      {pos && createPortal(<FieldCard def={def} x={pos.x} y={pos.y} above={pos.above} />, document.body)}
    </>
  )
}

function FieldCard({ def, x, y, above }: { def: FieldDef; x: number; y: number; above: boolean }) {
  return (
    <div
      className="pointer-events-none fixed z-[200] w-[420px] rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl"
      style={{ left: x, top: above ? undefined : y, bottom: above ? window.innerHeight - y : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-bold text-slate-900">{def.label}</div>
        <div className="flex shrink-0 gap-1">
          {def.required && <Chip tone="r">bắt buộc</Chip>}
          <Chip tone={ORIGIN_TONE[def.origin]}>{ORIGIN_LABEL[def.origin]}</Chip>
        </div>
      </div>
      <div className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{def.desc}</div>

      <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">← Giá trị này từ đâu ra</div>
        <div className="mt-0.5 text-[11.5px] leading-relaxed text-slate-700">{def.from}</div>
        {def.values && (
          <div className="mt-1.5 border-t border-slate-200 pt-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Giá trị hợp lệ</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{def.values}</div>
          </div>
        )}
      </div>

      {def.uses.length > 0 && (
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
            → Khai xong thì dùng ở đâu ({def.uses.length})
          </div>
          <ul className="mt-1 space-y-1">
            {def.uses.map((u, i) => (
              <li key={i} className="text-[11.5px] leading-relaxed">
                <span className="font-semibold text-blue-800">{u.menu}</span>
                <span className="text-slate-600"> — {u.how}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 text-[10px] text-slate-400">
        Thuộc nhóm đối tượng: {def.group} · mã trường <span className="mono">{def.key}</span>
      </div>
    </div>
  )
}

/** Nhãn kèm dấu ⓘ — dùng cho đầu cột bảng và nhãn trường trong form */
export function LabelWithInfo({ children, info }: { children: ReactNode; info?: string }) {
  if (!info || !fieldOf(info)) return <>{children}</>
  return (
    <span className="inline-flex items-center whitespace-nowrap">
      {children}
      <FieldInfo k={info} />
    </span>
  )
}

/** Liên kết nhanh tới nơi khai báo trường — dùng trong màn Tiêu chuẩn thông tin mô tả */
export function OriginLink({ def }: { def: FieldDef }) {
  if (!def.fromRoute) return <span className="text-slate-400">—</span>
  return (
    <Link to={def.fromRoute} className="text-[11.5px] font-semibold text-blue-600 hover:underline">
      Tới nơi khai báo
    </Link>
  )
}
