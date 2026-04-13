import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectItem {
  id: string
  label: string
  group?: string
  groupColor?: string
  badge?: ReactNode
  description?: string
}

interface SearchableMultiSelectProps {
  items: SelectItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  groupBy?: boolean
  maxHeight?: number
  emptyText?: string
}

export function SearchableMultiSelect({
  items,
  selectedIds,
  onChange,
  placeholder = 'Tìm kiếm...',
  groupBy = false,
  maxHeight = 240,
  emptyText = 'Không tìm thấy mục nào',
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = items.filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    return item.label.toLowerCase().includes(s) || (item.group?.toLowerCase().includes(s))
  })

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    )
  }

  // Group items
  const grouped = groupBy
    ? filtered.reduce<Record<string, SelectItem[]>>((acc, item) => {
        const g = item.group || 'Khác'
        if (!acc[g]) acc[g] = []
        acc[g].push(item)
        return acc
      }, {})
    : { '': filtered }

  const selectedCount = selectedIds.length

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / Search bar */}
      <div
        className={cn(
          'flex items-center border rounded-lg transition-colors cursor-pointer',
          isOpen ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-3.5 w-3.5 text-gray-400 ml-3 shrink-0" />
        <input
          type="text"
          className="flex-1 px-2 py-2 text-sm bg-transparent outline-none placeholder:text-gray-400"
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedCount > 0 && (
          <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 mr-1.5 shrink-0">
            Đã chọn: {selectedCount}
          </span>
        )}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 shrink-0"
          onClick={e => { e.stopPropagation(); setIsOpen(!isOpen) }}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          <div
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group}>
                {groupBy && group && (
                  <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    {group}
                  </div>
                )}
                {groupItems.map(item => {
                  const checked = selectedIds.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors',
                        checked ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <span className={cn('flex-1 truncate', checked ? 'text-gray-900 font-medium' : 'text-gray-700')}>
                        {item.label}
                      </span>
                      {item.badge && <span className="shrink-0">{item.badge}</span>}
                    </label>
                  )
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">{emptyText}</div>
            )}
          </div>

          {/* Quick actions footer */}
          {selectedCount > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs text-gray-500">{selectedCount} mục đã chọn</span>
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                onClick={() => onChange([])}
              >
                <X className="h-3 w-3" />Bỏ chọn tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
