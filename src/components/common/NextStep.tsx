import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Khối "Bước tiếp theo" — đặt cuối các màn khai báo chính.
 * Mục đích: người xem demo không phải đoán bước kế tiếp, demo tự chỉ đường.
 */
export function NextStep({
  done,
  steps,
}: {
  done: string
  steps: { label: string; desc: string; to: string }[]
}) {
  return (
    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold text-blue-900">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white">✓</span>
        Vừa xong: {done} — bước tiếp theo
      </div>
      <div className="flex flex-wrap gap-2.5">
        {steps.map(s => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex min-w-[240px] flex-1 items-center gap-3 rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 transition hover:border-blue-400 hover:shadow-sm"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold text-slate-800">{s.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{s.desc}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-blue-500 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
