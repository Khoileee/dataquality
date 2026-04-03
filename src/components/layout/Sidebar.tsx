import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Database, BarChart2, BookOpen, Calendar, Sliders,
  AlertTriangle, FileBarChart, Bell, Settings, Shield, ChevronRight, GitBranch
} from 'lucide-react'
import { useState } from 'react'

const navSections = [
  {
    title: 'TỔNG QUAN',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', href: '/' }]
  },
  {
    title: 'QUẢN LÝ DỮ LIỆU',
    items: [
      { icon: Database, label: 'Danh mục dữ liệu', href: '/data-catalog' },
      { icon: BarChart2, label: 'Phân tích dữ liệu', href: '/profiling' },
      { icon: GitBranch, label: 'Quản lý Job', href: '/pipeline' },
    ]
  },
  {
    title: 'CHẤT LƯỢNG',
    items: [
      { icon: BookOpen, label: 'Quản lý quy tắc', href: '/rules' },
      { icon: Calendar, label: 'Lịch chạy', href: '/schedules' },
      { icon: Sliders, label: 'Ngưỡng cảnh báo', href: '/thresholds' },
    ]
  },
  {
    title: 'GIÁM SÁT',
    items: [
      { icon: AlertTriangle, label: 'Vấn đề & Sự cố', href: '/issues' },
      { icon: FileBarChart, label: 'Báo cáo chất lượng', href: '/reports' },
    ]
  },
  {
    title: 'CẤU HÌNH',
    items: [
      { icon: Bell, label: 'Quản lý thông báo', href: '/notifications' },
      {
        icon: Settings, label: 'Cài đặt', href: '/settings',
        children: [
          { label: 'Quy tắc mặc định', href: '/settings/default-rules' },
          { label: 'Lịch mặc định', href: '/settings/default-schedules' },
          { label: 'Quản lý người dùng', href: '/settings/users' },
        ]
      },
    ]
  },
]

export function Sidebar() {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>(['/settings'])

  const isActive = (href: string) => href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)
  const toggleExpand = (href: string) => setExpandedItems(prev =>
    prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
  )

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col overflow-y-auto z-30"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-tight">Data Quality</div>
          <div className="text-[11px]" style={{ color: '#64748b' }}>Management System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navSections.map(section => (
          <div key={section.title} className="mb-1">
            <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: '#334155' }}>
              {section.title}
            </div>

            {section.items.map(item => {
              const Icon = item.icon
              const active = isActive(item.href || '')
              const hasChildren = 'children' in item && item.children
              const expanded = hasChildren && expandedItems.includes(item.href || '')

              const linkCls = cn(
                'relative flex items-center gap-2.5 w-full px-4 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'text-blue-300'
                  : 'text-slate-400 hover:text-slate-100'
              )
              const iconCls = cn('h-4 w-4 shrink-0', active ? 'text-blue-400' : 'text-slate-500')

              return (
                <div key={item.label}>
                  {/* Active background highlight */}
                  {hasChildren ? (
                    <button onClick={() => toggleExpand(item.href || '')}
                      className={linkCls}
                      style={active ? { background: 'rgba(59,130,246,0.12)' } : {}}>
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                          style={{ background: '#3b82f6' }} />
                      )}
                      <Icon className={iconCls} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={cn('h-3.5 w-3.5 transition-transform shrink-0 text-slate-600',
                        expanded && 'rotate-90')} />
                    </button>
                  ) : (
                    <Link to={item.href!}
                      className={linkCls}
                      style={active ? { background: 'rgba(59,130,246,0.12)' } : {}}>
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                          style={{ background: '#3b82f6' }} />
                      )}
                      <Icon className={iconCls} />
                      <span>{item.label}</span>
                    </Link>
                  )}

                  {hasChildren && expanded && item.children && (
                    <div className="pb-1" style={{ paddingLeft: '2.75rem' }}>
                      {item.children.map(child => (
                        <Link key={child.href} to={child.href}
                          className={cn('block px-2 py-1.5 text-sm rounded-md transition-colors',
                            location.pathname === child.href
                              ? 'text-blue-300 font-medium'
                              : 'text-slate-500 hover:text-slate-300')}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            AD
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#cbd5e1' }}>Nguyễn Văn Admin</div>
            <div className="text-xs" style={{ color: '#475569' }}>Quản trị viên</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
