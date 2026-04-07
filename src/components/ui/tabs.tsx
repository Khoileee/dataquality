import { cn } from '@/lib/utils'
import { ReactNode, useState, useEffect } from 'react'

interface Tab {
  id: string
  label: ReactNode
  content: ReactNode
  icon?: ReactNode
  badge?: number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  activeTab?: string
  onTabChange?: (id: string) => void
  onChange?: (id: string) => void
  className?: string
  /** Optional description text shown to the right of tabs */
  description?: string
}

export function Tabs({ tabs, defaultTab, activeTab, onTabChange, onChange, className, description }: TabsProps) {
  const [internal, setInternal] = useState(activeTab ?? defaultTab ?? tabs[0]?.id)
  const active = activeTab ?? internal

  useEffect(() => {
    if (activeTab !== undefined) setInternal(activeTab)
  }, [activeTab])

  const handleChange = (id: string) => {
    setInternal(id)
    onTabChange?.(id)
    onChange?.(id)
  }

  const current = tabs.find(t => t.id === active)
  return (
    <div className={cn('', className)}>
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                  isActive
                    ? 'bg-blue-500/30 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
        {description && (
          <div className="ml-auto px-3 text-xs text-gray-400">
            {description}
          </div>
        )}
      </div>
      <div className="mt-4">{current?.content}</div>
    </div>
  )
}
