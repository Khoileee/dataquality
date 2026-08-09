import { cn } from '@/lib/utils'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { X, CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─────────────── Toast ─────────────── */

type ToastKind = 'success' | 'info' | 'warn' | 'error'
type ToastItem = { id: number; kind: ToastKind; msg: string; detail?: string }

const ToastCtx = createContext<{
  push: (kind: ToastKind, msg: string, detail?: string) => void
}>({ push: () => {} })

export function useToast() {
  const { push } = useContext(ToastCtx)
  return {
    success: (m: string, d?: string) => push('success', m, d),
    info: (m: string, d?: string) => push('info', m, d),
    warn: (m: string, d?: string) => push('warn', m, d),
    error: (m: string, d?: string) => push('error', m, d),
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((kind: ToastKind, msg: string, detail?: string) => {
    const id = Date.now() + Math.random()
    setItems(prev => [...prev, { id, kind, msg, detail }])
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  const style: Record<ToastKind, { icon: ReactNode; cls: string }> = {
    success: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, cls: 'border-emerald-200 bg-emerald-50' },
    info: { icon: <Info className="h-4 w-4 text-blue-600" />, cls: 'border-blue-200 bg-blue-50' },
    warn: { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, cls: 'border-amber-200 bg-amber-50' },
    error: { icon: <XCircle className="h-4 w-4 text-red-600" />, cls: 'border-red-200 bg-red-50' },
  }

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-[360px] flex-col gap-2">
        {items.map(t => (
          <div
            key={t.id}
            className={cn('dmp-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-lg', style[t.kind].cls)}
          >
            <div className="mt-0.5 shrink-0">{style[t.kind].icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-800">{t.msg}</div>
              {t.detail && <div className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{t.detail}</div>}
            </div>
            <button onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ─────────────── Modal ─────────────── */

export function Modal({
  open,
  onClose,
  title,
  desc,
  size = 'md',
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  desc?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  footer?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-5xl', '2xl': 'max-w-6xl' }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-6">
      <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('dmp-in relative my-6 flex w-full flex-col rounded-xl bg-white shadow-2xl', sizes[size])}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>}
            {desc && <p className="mt-0.5 text-[12px] text-slate-500">{desc}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

/* ─────────────── Drawer ─────────────── */

export function Drawer({
  open,
  onClose,
  title,
  desc,
  width = 560,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  desc?: ReactNode
  width?: number
  footer?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <aside
        className="dmp-drawer absolute right-0 top-0 flex h-full flex-col bg-white shadow-2xl"
        style={{ width }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[15px] font-bold text-slate-900">{title}</h2>}
            {desc && <p className="mt-0.5 text-[12px] text-slate-500">{desc}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  )
}

/* ─────────────── Xác nhận ─────────────── */

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Đồng ý',
  danger,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmText?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Huỷ</Button>
          <Button size="sm" variant={danger ? 'destructive' : 'default'} onClick={() => { onConfirm(); onClose() }}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-[13px] leading-relaxed text-slate-600">{message}</div>
    </Modal>
  )
}
