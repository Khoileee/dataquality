import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home, Search, ChevronDown } from 'lucide-react'

/* ─────────────── Card ─────────────── */

export function Panel({
  title,
  desc,
  actions,
  children,
  className,
  bodyClassName,
  tone = 'default',
  noPad,
}: {
  title?: ReactNode
  desc?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  bodyClassName?: string
  tone?: 'default' | 'ok' | 'warn' | 'bad' | 'info' | 'dark'
  noPad?: boolean
}) {
  const tones = {
    default: 'bg-white border-slate-200',
    ok: 'bg-emerald-50/70 border-emerald-200',
    warn: 'bg-amber-50/70 border-amber-200',
    bad: 'bg-red-50/70 border-red-200',
    info: 'bg-blue-50/60 border-blue-200',
    dark: 'bg-slate-900 border-slate-800 text-slate-100',
  }
  return (
    <section className={cn('rounded-xl border shadow-sm', tones[tone], className)}>
      {(title || actions) && (
        <header className={cn('flex items-start justify-between gap-3 px-4 pt-3.5', desc ? 'pb-2' : 'pb-3')}>
          <div className="min-w-0">
            {title && (
              <h3 className={cn('text-[13px] font-bold', tone === 'dark' ? 'text-white' : 'text-slate-800')}>{title}</h3>
            )}
            {desc && <p className={cn('mt-0.5 text-[11.5px]', tone === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{desc}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(noPad ? '' : 'px-4 pb-4', !title && !noPad && 'pt-4', bodyClassName)}>{children}</div>
    </section>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <span className="inline-block border-b-2 border-blue-600 pb-1 text-[12.5px] font-bold text-blue-700">{children}</span>
      {right}
    </div>
  )
}

/* ─────────────── Hộp ghi chú ─────────────── */

export function Note({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'ok' | 'bad' | 'warn' | 'info'
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  const map = {
    ok: { box: 'bg-emerald-50 border-emerald-200', head: 'text-emerald-800', icon: '✅' },
    bad: { box: 'bg-red-50 border-red-200', head: 'text-red-800', icon: '🔴' },
    warn: { box: 'bg-amber-50 border-amber-200', head: 'text-amber-800', icon: '⚠️' },
    info: { box: 'bg-blue-50 border-blue-200', head: 'text-blue-800', icon: '💡' },
  }[tone]
  return (
    <div className={cn('rounded-lg border px-3.5 py-3 text-[12px] leading-relaxed text-slate-700', map.box, className)}>
      {title && (
        <div className={cn('mb-1 flex items-center gap-1.5 text-[12.5px] font-bold', map.head)}>
          <span>{map.icon}</span>
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

/* ─────────────── Thẻ số liệu ─────────────── */

export type Kpi = {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'ok' | 'warn' | 'bad' | 'info'
  onClick?: () => void
}

export function KpiRow({ items, cols }: { items: Kpi[]; cols?: number }) {
  const toneCls = {
    default: 'text-slate-900',
    ok: 'text-emerald-600',
    warn: 'text-amber-600',
    bad: 'text-red-600',
    info: 'text-blue-600',
  }
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols ?? items.length}, minmax(0,1fr))` }}>
      {items.map((k, i) => (
        <div
          key={i}
          onClick={k.onClick}
          className={cn(
            'rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm',
            k.onClick && 'cursor-pointer transition-shadow hover:shadow-md'
          )}
        >
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{k.label}</div>
          <div className={cn('mt-1 text-[23px] font-extrabold leading-tight', toneCls[k.tone ?? 'default'])}>{k.value}</div>
          {k.sub && <div className="mt-0.5 text-[11px] text-slate-400">{k.sub}</div>}
        </div>
      ))}
    </div>
  )
}

/* ─────────────── Đầu trang ─────────────── */

export type Crumb = { label: string; href?: string }

export function PageHeader({
  title,
  desc,
  crumbs,
  actions,
  code,
}: {
  title: ReactNode
  desc?: ReactNode
  crumbs?: Crumb[]
  actions?: ReactNode
  code?: string
}) {
  return (
    <div className="mb-4">
      {crumbs && (
        <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11.5px] text-slate-400">
          <Link to="/" className="flex items-center gap-1 hover:text-blue-600">
            <Home className="h-3 w-3" /> Trang chủ
          </Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-300" />
              {c.href ? (
                <Link to={c.href} className="hover:text-blue-600">{c.label}</Link>
              ) : (
                <span className="font-medium text-slate-600">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[19px] font-bold leading-tight text-slate-900">
            {code && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{code}</span>
            )}
            {title}
          </h1>
          {desc && <p className="mt-1 text-[12.5px] text-slate-500">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ─────────────── Tab theo route thật ─────────────── */

export function RouteTabs({ items }: { items: { label: ReactNode; to: string; end?: boolean; badge?: number }[] }) {
  const { pathname } = useLocation()
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-slate-200">
      {items.map(t => {
        const active = t.end ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + '/')
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              'relative -mb-px flex items-center gap-1.5 px-3.5 py-2 text-[13px] transition-colors',
              active
                ? 'border-b-2 border-blue-600 font-bold text-blue-700'
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={cn(
                'rounded-full px-1.5 text-[10px] font-bold',
                active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              )}>{t.badge}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

/** Tab nội bộ trong màn (không đổi route) */
export function InlineTabs({
  items,
  active,
  onChange,
}: {
  items: { id: string; label: ReactNode; badge?: number }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-slate-200">
      {items.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex items-center gap-1.5 px-3.5 py-2 text-[13px] transition-colors',
            active === t.id
              ? 'border-b-2 border-blue-600 font-bold text-blue-700'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          {t.label}
          {t.badge !== undefined && t.badge > 0 && (
            <span className={cn('rounded-full px-1.5 text-[10px] font-bold',
              active === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ─────────────── Thanh lọc ─────────────── */

export function FilterBar({
  placeholder = 'Tìm kiếm…',
  value,
  onChange,
  filters,
  right,
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  filters?: { label: string; options: string[]; value: string; onChange: (v: string) => void }[]
  right?: ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-[13px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {filters?.map((f, i) => (
        <div key={i} className="relative">
          <select
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-[12.5px] font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{f.label}: Tất cả</option>
            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      ))}
      {right && <div className="ml-auto flex shrink-0 items-center gap-2 pr-0.5">{right}</div>}
    </div>
  )
}

/* ─────────────── Lưới thông tin nhãn : giá trị ─────────────── */

export function InfoGrid({
  items,
  cols = 2,
}: {
  items: { label: ReactNode; value: ReactNode; full?: boolean }[]
  cols?: number
}) {
  return (
    <dl className="grid gap-x-6 gap-y-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {items.map((it, i) => (
        <div key={i} style={it.full ? { gridColumn: `span ${cols}` } : undefined}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{it.label}</dt>
          <dd className="mt-0.5 text-[13px] text-slate-800">{it.value ?? <span className="text-slate-300">—</span>}</dd>
        </div>
      ))}
    </dl>
  )
}
