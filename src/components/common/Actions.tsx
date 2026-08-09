import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2, Play, RotateCcw, Copy, Download, Upload, Plus, ExternalLink } from 'lucide-react'

export function IconBtn({
  icon,
  title,
  onClick,
  to,
  tone = 'default',
  disabled,
}: {
  icon: 'view' | 'edit' | 'delete' | 'run' | 'revert' | 'copy' | 'export' | 'open'
  title: string
  onClick?: () => void
  to?: string
  tone?: 'default' | 'danger'
  disabled?: boolean
}) {
  const Icon = {
    view: Eye, edit: Pencil, delete: Trash2, run: Play,
    revert: RotateCcw, copy: Copy, export: Download, open: ExternalLink,
  }[icon]
  const cls = cn(
    'inline-flex h-7 w-7 items-center justify-center rounded-md border transition',
    disabled
      ? 'cursor-not-allowed border-slate-200 text-slate-300'
      : tone === 'danger'
        ? 'border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
        : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
  )
  if (to && !disabled) return <Link to={to} title={title} className={cls}><Icon className="h-3.5 w-3.5" /></Link>
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={cls}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1 whitespace-nowrap">{children}</div>
}

/** Nút chính hình chữ nhật — đồng bộ với Button của shadcn nhưng có icon sẵn */
export function ActionButton({
  children,
  icon,
  to,
  onClick,
  variant = 'primary',
  size = 'sm',
  disabled,
  title,
  className,
}: {
  children: ReactNode
  icon?: 'plus' | 'export' | 'import' | 'run' | 'edit' | 'copy'
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'soft'
  size?: 'sm' | 'md'
  disabled?: boolean
  title?: string
  className?: string
}) {
  const Icon = icon ? { plus: Plus, export: Download, import: Upload, run: Play, edit: Pencil, copy: Copy }[icon] : null
  const cls = cn(
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition whitespace-nowrap',
    size === 'sm' ? 'h-8 px-3 text-[12.5px]' : 'h-9 px-4 text-[13px]',
    disabled && 'cursor-not-allowed opacity-50',
    variant === 'primary' && 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
    variant === 'ghost' && 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
    variant === 'soft' && 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
    className
  )
  if (to && !disabled) return <Link to={to} title={title} className={cls}>{Icon && <Icon className="h-3.5 w-3.5" />}{children}</Link>
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={cls}>
      {Icon && <Icon className="h-3.5 w-3.5" />}{children}
    </button>
  )
}

/** Liên kết mã thực thể — bấm được, kiểu mono */
export function EntityLink({ to, children, mono = true }: { to: string; children: ReactNode; mono?: boolean }) {
  return (
    <Link to={to} className={cn('font-semibold text-blue-600 hover:text-blue-800 hover:underline', mono && 'mono text-[12px]')}>
      {children}
    </Link>
  )
}
