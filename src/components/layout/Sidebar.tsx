import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MENU } from '@/app/menu'
import { APP } from '@/config'
import { Database } from 'lucide-react'

export function Sidebar() {
  const { pathname } = useLocation()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-full w-[248px] flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(180deg,#16233F 0%,#131E36 100%)' }}
    >
      {/* Logo */}
      <Link to="/" className="flex shrink-0 items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #2B3A5C' }}>
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Database className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-extrabold leading-tight text-white">{APP.name}</div>
          <div className="truncate text-[10px] text-[#8FA3C8]">{APP.tagline}</div>
        </div>
      </Link>

      <nav className="flex-1 py-1.5">
        {MENU.map(section => (
          <div key={section.id} className="mb-0.5">
            <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.7px] text-[#6D81A8]">
              <span className="text-[11px]">{section.no}</span>
              {section.title}
            </div>

            {section.items.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={`${item.code} · ${item.label}`}
                  className={cn(
                    'relative flex items-center gap-2.5 px-4 py-[7px] text-[12.5px] transition-colors',
                    active ? 'bg-[#2B3A5C] font-semibold text-white' : 'text-[#C3CEE2] hover:bg-[#1E2E4F] hover:text-white'
                  )}
                >
                  {active && <span className="absolute left-0 top-0 h-full w-[3px] bg-[#0EA5A5]" />}
                  <Icon className={cn('h-[15px] w-[15px] shrink-0', active ? 'text-[#7FD8D8]' : 'text-[#7286AD]')} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.isNew && (
                    <span
                      title="Menu bổ sung sau khi review đối chiếu yêu cầu BDA"
                      className="shrink-0 rounded-full bg-[#0EA5A5]/20 px-1.5 text-[9px] font-bold text-[#5EEAD4]"
                    >
                      MỚI
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-4 py-3 text-[10px] leading-relaxed text-[#5B6D91]" style={{ borderTop: '1px solid #2B3A5C' }}>
        {APP.version} · 8 module · 34 menu
        <br />
        Dữ liệu minh hoạ — không kết nối hệ thống thật
      </div>
    </aside>
  )
}
