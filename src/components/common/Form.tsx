import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { LabelWithInfo } from './FieldInfo'

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
  full,
  info,
}: {
  label: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
  full?: boolean
  /** Mã trường trong từ điển trường thông tin — hiện dấu ⓘ giải thích nguồn gốc và nơi dùng */
  info?: string
}) {
  return (
    <div className={cn('min-w-0', full && 'col-span-full', className)}>
      <label className="mb-1 block text-[12px] font-semibold text-slate-700">
        <LabelWithInfo info={info}>{label}</LabelWithInfo> {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

const inputCls =
  'h-9 w-full rounded-lg border bg-white px-3 text-[13px] outline-none transition placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400'

export function TextInput({
  invalid,
  mono,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; mono?: boolean }) {
  return (
    <input
      {...rest}
      className={cn(
        inputCls,
        invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
        mono && 'mono',
        className
      )}
    />
  )
}

export function TextArea({
  invalid,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full rounded-lg border bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-slate-300',
        invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
        className
      )}
    />
  )
}

export function SelectInput({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(inputCls, 'border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100', className)}
    >
      {children}
    </select>
  )
}

export function ReadOnlyValue({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <div className={cn('flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500', mono && 'mono')}>
      {children}
    </div>
  )
}

/* ─────────────── Wizard steps ─────────────── */

export function Steps({
  items,
  current,
  onJump,
}: {
  items: string[]
  current: number
  onJump?: (i: number) => void
}) {
  return (
    <div className="mb-5 flex items-center">
      {items.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'now' : 'next'
        return (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={onJump ? () => onJump(i) : undefined}
              disabled={!onJump}
              className={cn('flex items-center gap-2', onJump && 'cursor-pointer')}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  state === 'done' && 'bg-emerald-500 text-white',
                  state === 'now' && 'bg-blue-600 text-white ring-4 ring-blue-100',
                  state === 'next' && 'bg-slate-200 text-slate-500'
                )}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[12.5px]',
                  state === 'now' ? 'font-bold text-slate-900' : state === 'done' ? 'font-medium text-slate-600' : 'text-slate-400'
                )}
              >
                {label}
              </span>
            </button>
            {i < items.length - 1 && (
              <div className={cn('mx-3 h-px flex-1', i < current ? 'bg-emerald-300' : 'bg-slate-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────── Ô chọn dạng thẻ ─────────────── */

export function OptionCards<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { id: T; label: ReactNode; desc?: ReactNode; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
  cols?: number
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition',
            value === o.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
              value === o.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
            )}
          >
            {value === o.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-slate-800">{o.label}</span>
            {o.desc && <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{o.desc}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  disabled?: boolean
  hint?: ReactNode
}) {
  return (
    <div>
      <label className={cn('flex items-center gap-2.5', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors',
            checked ? 'bg-blue-600' : 'bg-slate-300'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
              checked ? 'left-[18px]' : 'left-0.5'
            )}
          />
        </button>
        {label && <span className="text-[12.5px] text-slate-700">{label}</span>}
      </label>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

/** Ô nhập nhiều giá trị kiểu chip */
export function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5">
      {values.map(v => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11.5px] font-medium text-blue-700">
          {v}
          <button onClick={() => onChange(values.filter(x => x !== v))} className="text-blue-400 hover:text-blue-700">×</button>
        </span>
      ))}
      <input
        placeholder={placeholder}
        onKeyDown={e => {
          const t = e.target as HTMLInputElement
          if (e.key === 'Enter' && t.value.trim()) {
            onChange([...values, t.value.trim()])
            t.value = ''
            e.preventDefault()
          }
        }}
        className="min-w-[120px] flex-1 border-0 text-[13px] outline-none placeholder:text-slate-300"
      />
    </div>
  )
}
