import { ReactNode } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem { label: string; href?: string }
interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-2 flex-wrap">
          <Link to="/" className="flex items-center gap-1 hover:text-blue-600">
            <Home className="h-3 w-3" />Trang chủ
          </Link>
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-gray-400" />
              {item.href
                ? <Link to={item.href} className="hover:text-blue-600">{item.label}</Link>
                : <span className="text-gray-700 font-medium">{item.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
