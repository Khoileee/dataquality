import { cn } from '@/lib/utils'
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

/* ─────────────── Thanh tiến độ có vạch mục tiêu ─────────────── */

export function ProgressBar({
  pct,
  target,
  label,
  note,
  tone,
  height = 14,
}: {
  pct: number
  target?: number
  label?: ReactNode
  note?: ReactNode
  tone?: 'ok' | 'warn' | 'bad' | 'info'
  height?: number
}) {
  const auto = tone ?? (pct >= 80 ? 'ok' : pct >= 55 ? 'warn' : 'bad')
  const color = { ok: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500', info: 'bg-blue-500' }[auto]
  return (
    <div>
      {(label || note) && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label && <span className="text-[12px] font-medium text-slate-700">{label}</span>}
          {note && <span className="text-[11px] text-slate-400">{note}</span>}
        </div>
      )}
      <div className="relative w-full overflow-visible rounded bg-slate-100" style={{ height }}>
        <div className={cn('h-full rounded transition-all duration-500', color)} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        {target !== undefined && (
          <div
            title={`Mục tiêu ${target}%`}
            className="absolute top-[-4px] w-0.5 bg-slate-800"
            style={{ left: `${target}%`, height: height + 8 }}
          />
        )}
      </div>
    </div>
  )
}

/** Biểu đồ cột nhỏ (sparkline dạng bar) */
export function MiniBars({
  values,
  tone = 'info',
  height = 22,
  threshold,
}: {
  values: number[]
  tone?: 'ok' | 'warn' | 'bad' | 'info'
  height?: number
  threshold?: number
}) {
  const max = Math.max(...values, 1)
  const base = { ok: 'bg-emerald-400', warn: 'bg-amber-400', bad: 'bg-red-400', info: 'bg-blue-400' }[tone]
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          title={String(v)}
          className={cn('w-[5px] rounded-sm', threshold !== undefined && v < threshold ? 'bg-red-400' : base)}
          style={{ height: Math.max(2, (v / max) * height) }}
        />
      ))}
    </div>
  )
}

/** Vòng tròn điểm số */
export function ScoreRing({ score, size = 82, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth="7" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="7" fill="none"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[19px] font-extrabold leading-none" style={{ color }}>{score}</span>
        {label && <span className="mt-0.5 text-[9.5px] font-semibold uppercase text-slate-400">{label}</span>}
      </div>
    </div>
  )
}

/* ─────────────── Dải trạng thái ─────────────── */

export function StatusFlow({
  steps,
  active,
  onPick,
}: {
  steps: { label: string; count?: number; tone?: 'b' | 'g' | 'r' | 'o' | 'n' | 'p' }[]
  active?: string
  onPick?: (label: string) => void
}) {
  const toneCls = {
    b: 'border-blue-200 bg-blue-50 text-blue-700',
    g: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    r: 'border-red-200 bg-red-50 text-red-700',
    o: 'border-amber-200 bg-amber-50 text-amber-700',
    n: 'border-slate-200 bg-slate-50 text-slate-600',
    p: 'border-violet-200 bg-violet-50 text-violet-700',
  }
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          <button
            onClick={onPick ? () => onPick(s.label) : undefined}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition',
              toneCls[s.tone ?? 'n'],
              active === s.label && 'ring-2 ring-blue-300',
              onPick && 'cursor-pointer hover:brightness-95'
            )}
          >
            {s.label}
            {s.count !== undefined && <span className="ml-1.5 font-extrabold">{s.count}</span>}
          </button>
          {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
        </div>
      ))}
    </div>
  )
}

/* ─────────────── Dòng thời gian ─────────────── */

export function Timeline({
  items,
}: {
  items: { time: string; who?: string; title: ReactNode; text?: ReactNode; tone?: 'b' | 'g' | 'r' | 'o' | 'n' }[]
}) {
  const dot = { b: 'bg-blue-500', g: 'bg-emerald-500', r: 'bg-red-500', o: 'bg-amber-500', n: 'bg-slate-300' }
  return (
    <ol className="relative ml-2 border-l border-slate-200">
      {items.map((it, i) => (
        <li key={i} className="relative pb-4 pl-5 last:pb-0">
          <span className={cn('absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white', dot[it.tone ?? 'n'])} />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[12.5px] font-semibold text-slate-800">{it.title}</span>
            <span className="mono text-[11px] text-slate-400">{it.time}</span>
            {it.who && <span className="text-[11px] text-slate-500">· {it.who}</span>}
          </div>
          {it.text && <div className="mt-0.5 text-[12px] leading-relaxed text-slate-600">{it.text}</div>}
        </li>
      ))}
    </ol>
  )
}

/* ─────────────── Cây phân cấp ─────────────── */

export type TreeNode = {
  id: string
  label: ReactNode
  count?: number
  badge?: ReactNode
  children?: TreeNode[]
}

export function TreeView({
  nodes,
  activeId,
  onPick,
  defaultOpen = true,
}: {
  nodes: TreeNode[]
  activeId?: string
  onPick?: (id: string) => void
  defaultOpen?: boolean
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map(n => (
        <TreeItem key={n.id} node={n} activeId={activeId} onPick={onPick} depth={0} defaultOpen={defaultOpen} />
      ))}
    </ul>
  )
}

function TreeItem({
  node, activeId, onPick, depth, defaultOpen,
}: { node: TreeNode; activeId?: string; onPick?: (id: string) => void; depth: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const hasKids = !!node.children?.length
  const active = activeId === node.id
  return (
    <li>
      <div
        onClick={() => onPick?.(node.id)}
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[12.5px] transition',
          active ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700 hover:bg-slate-50'
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasKids ? (
          <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }} className="shrink-0 text-slate-400">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {node.badge}
        {node.count !== undefined && (
          <span className={cn('shrink-0 rounded-full px-1.5 text-[10px] font-bold', active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
            {node.count}
          </span>
        )}
      </div>
      {hasKids && open && (
        <ul className="space-y-0.5">
          {node.children!.map(c => (
            <TreeItem key={c.id} node={c} activeId={activeId} onPick={onPick} depth={depth + 1} defaultOpen={defaultOpen} />
          ))}
        </ul>
      )}
    </li>
  )
}

/* ─────────────── Khối mã ─────────────── */

export function CodeBlock({
  children,
  dark = true,
  title,
  className,
}: {
  children: ReactNode
  dark?: boolean
  title?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', dark ? 'border-slate-800' : 'border-slate-200', className)}>
      {title && (
        <div className={cn('px-3 py-1.5 text-[11px] font-semibold', dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-500')}>
          {title}
        </div>
      )}
      <pre
        className={cn(
          'mono overflow-x-auto px-3.5 py-3 text-[11.5px] leading-relaxed',
          dark ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'
        )}
      >
        {children}
      </pre>
    </div>
  )
}

export const SqlKw = ({ children }: { children: ReactNode }) => <span className="text-[#93B4FF]">{children}</span>
export const SqlVal = ({ children }: { children: ReactNode }) => <span className="text-[#FFD479]">{children}</span>
export const SqlCmt = ({ children }: { children: ReactNode }) => <span className="text-slate-500">{children}</span>
export const LineAdd = ({ children }: { children: ReactNode }) => (
  <span className="block bg-[#123522] text-[#75E0A7]">{children}</span>
)
export const LineDel = ({ children }: { children: ReactNode }) => (
  <span className="block bg-[#3D1D1D] text-[#FDA29B]">{children}</span>
)

/* ─────────────── Sơ đồ luồng ─────────────── */

export type FlowNode = {
  id: string
  x: number
  y: number
  w?: number
  h?: number
  title: string
  sub?: string
  tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'active' | 'source' | 'target'
  badge?: { text: string; tone: 'g' | 'r' | 'o' | 'b' | 'n' }
  to?: string
}

export type FlowEdge = {
  from: string
  to: string
  tone?: 'neutral' | 'bad' | 'warn' | 'ok'
  dashed?: boolean
  label?: string
}

export function FlowDiagram({
  nodes,
  edges,
  height = 320,
  width = 1000,
  onNodeClick,
  minScale = 0.72,
}: {
  nodes: FlowNode[]
  edges: FlowEdge[]
  height?: number
  width?: number
  onNodeClick?: (n: FlowNode) => void
  /** Co nhỏ tối đa tới mức này để vừa khung; hẹp hơn nữa thì cho cuộn ngang */
  minScale?: number
}) {
  /* Tự co sơ đồ cho vừa bề ngang khung chứa — tránh nút bị cắt mất */
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => {
      const avail = el.clientWidth - 24
      setScale(avail > 0 ? Math.min(1, Math.max(minScale, avail / width)) : 1)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, minScale])

  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const NW = 170
  /** Chiều cao mặc định — đủ chỗ cho tên, dòng phụ và nhãn badge mà không cắt chữ */
  const NH = 62

  const toneCls: Record<string, string> = {
    neutral: 'border-slate-300 bg-white',
    ok: 'border-emerald-400 bg-emerald-50',
    warn: 'border-amber-400 bg-amber-50',
    bad: 'border-red-400 bg-red-50',
    active: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
    source: 'border-slate-300 bg-slate-50',
    target: 'border-emerald-500 bg-white ring-2 ring-emerald-100',
  }
  const edgeColor: Record<string, string> = {
    neutral: '#94a3b8', bad: '#ef4444', warn: '#f59e0b', ok: '#10b981',
  }

  return (
    <div ref={wrapRef} className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div style={{ height: height * scale, width: width * scale }}>
      <div
        className="relative origin-top-left"
        style={{ height, width, minWidth: width, transform: scale === 1 ? undefined : `scale(${scale})` }}
      >
        <svg className="absolute inset-0" width={width} height={height}>
          <defs>
            {Object.entries(edgeColor).map(([k, v]) => (
              <marker key={k} id={`arw-${k}`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill={v} />
              </marker>
            ))}
          </defs>
          {edges.map((e, i) => {
            const a = byId[e.from], b = byId[e.to]
            if (!a || !b) return null
            const aw = a.w ?? NW, ah = a.h ?? NH, bw = b.w ?? NW, bh = b.h ?? NH
            const x1 = a.x + aw, y1 = a.y + ah / 2
            const x2 = b.x, y2 = b.y + bh / 2
            const mid = x1 + (x2 - x1) / 2
            const pts = `${x1},${y1} ${mid},${y1} ${mid},${y2} ${x2 - 4},${y2}`
            const tone = e.tone ?? 'neutral'
            /** Chỉ vẽ nhãn khi khoảng hở giữa hai nút đủ rộng — tránh chữ đè lên nút */
            const gap = x2 - x1
            const labelW = e.label ? e.label.length * 5.2 + 10 : 0
            const showLabel = !!e.label && gap > labelW + 12
            const ly = (y1 + y2) / 2
            return (
              <g key={i}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={edgeColor[tone]}
                  strokeWidth="1.8"
                  strokeDasharray={e.dashed ? '5 4' : undefined}
                  markerEnd={`url(#arw-${tone})`}
                />
                {showLabel && (
                  <>
                    <rect x={mid - labelW / 2} y={ly - 15} width={labelW} height={13} rx={3} fill="#F8FAFC" opacity="0.95" />
                    <text x={mid} y={ly - 5} fontSize="9.5" textAnchor="middle" fill={edgeColor[tone]} className="font-semibold">
                      {e.label}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>

        {nodes.map(n => {
          const inner = (
            <div
              className={cn(
                'flex h-full w-full flex-col justify-center gap-[1px] overflow-hidden rounded-lg border px-2.5 py-1.5 shadow-sm transition',
                toneCls[n.tone ?? 'neutral'],
                (n.to || onNodeClick) && 'cursor-pointer hover:shadow-md'
              )}
            >
              <div className="truncate text-[11px] font-bold leading-tight text-slate-800" title={n.title}>{n.title}</div>
              {n.sub && <div className="truncate text-[9.5px] leading-tight text-slate-500" title={n.sub}>{n.sub}</div>}
              {n.badge && (
                <div className="mt-[3px] leading-none">
                  <span className={cn(
                    'inline-block rounded-full px-1.5 py-[1px] text-[9px] font-bold leading-[14px]',
                    n.badge.tone === 'g' && 'bg-emerald-100 text-emerald-700',
                    n.badge.tone === 'r' && 'bg-red-100 text-red-700',
                    n.badge.tone === 'o' && 'bg-amber-100 text-amber-700',
                    n.badge.tone === 'b' && 'bg-blue-100 text-blue-700',
                    n.badge.tone === 'n' && 'bg-slate-100 text-slate-600',
                  )}>{n.badge.text}</span>
                </div>
              )}
            </div>
          )
          const style = { left: n.x, top: n.y, width: n.w ?? NW, height: n.h ?? NH }
          return n.to ? (
            <Link key={n.id} to={n.to} className="absolute" style={style}>{inner}</Link>
          ) : (
            <div key={n.id} className="absolute" style={style} onClick={() => onNodeClick?.(n)}>{inner}</div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
