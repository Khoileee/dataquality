import { Bell, Search, ChevronDown } from 'lucide-react'

export function Header() {
  return (
    <header
      className="fixed top-0 left-60 right-0 h-14 bg-white flex items-center justify-between px-6 z-20"
      style={{
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
      }}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            placeholder="Tìm kiếm bảng, quy tắc..."
            className="pl-8 pr-3 w-64 h-8 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            style={{
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0f172a',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-slate-100"
          style={{ color: '#64748b' }}>
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* User avatar */}
        <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            AD
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">Admin</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  )
}
