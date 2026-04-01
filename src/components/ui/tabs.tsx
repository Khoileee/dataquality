import { cn } from '@/lib/utils'
import { ReactNode, useState, useEffect } from 'react'

interface Tab { id: string; label: ReactNode; content: ReactNode }
interface TabsProps { tabs: Tab[]; defaultTab?: string; activeTab?: string; onTabChange?: (id: string) => void; onChange?: (id: string) => void; className?: string }

export function Tabs({ tabs, defaultTab, activeTab, onTabChange, onChange, className }: TabsProps) {
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
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => handleChange(tab.id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              active === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{current?.content}</div>
    </div>
  )
}

