import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Bell, HelpCircle } from 'lucide-react'
import { DEMO_USERS, ROLES } from '@/config'
import { useUser } from '@/app/UserContext'
import { cn } from '@/lib/utils'
import { pendingApprovals, incidents } from '@/data'

export function Topbar() {
  const { user, setUserId } = useUser()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()

  const openIncidents = incidents.filter(i => i.status !== 'Đã đóng').length
  const waiting = pendingApprovals.length

  return (
    <header
      className="fixed left-[248px] right-0 top-0 z-20 flex h-14 items-center gap-4 bg-white px-5"
      style={{ borderBottom: '1px solid #E3E8EF' }}
    >
      <form
        onSubmit={e => { e.preventDefault(); nav(`/catalog/search?q=${encodeURIComponent(q)}`) }}
        className="relative w-[420px]"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm bảng, cột, thuật ngữ, báo cáo, chỉ tiêu, job…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-16 text-[13px] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
          Enter
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => nav('/governance/approvals')}
          title="Chờ tôi duyệt"
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
          {waiting > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {waiting}
            </span>
          )}
        </button>
        <button
          onClick={() => nav('/quality/incidents')}
          title="Sự cố chất lượng đang mở"
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <HelpCircle className="h-4 w-4" />
          {openIncidents > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
              {openIncidents}
            </span>
          )}
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[11px] font-bold text-white">
              {user.initials}
            </span>
            <span className="text-left">
              <span className="block text-[12.5px] font-semibold leading-tight text-slate-800">{user.name}</span>
              <span className="block text-[10.5px] leading-tight text-slate-400">
                {ROLES[user.role].short} — {user.unit}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-[320px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                  Đổi vai để xem quyền thao tác thay đổi thế nào
                </div>
                {DEMO_USERS.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setUserId(u.id); setOpen(false) }}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                      u.id === user.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                      {u.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-slate-800">{u.name}</span>
                      <span className="block text-[11px] text-slate-500">{ROLES[u.role].label} · {u.unit}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
