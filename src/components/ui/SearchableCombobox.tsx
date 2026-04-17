import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxItem {
  value: string
  label: string
  group?: string
  description?: string
}

interface SearchableComboboxProps {
  value: string | null
  onChange: (val: string) => void
  items: ComboboxItem[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  emptyText?: string
  className?: string
  allowClear?: boolean
}

export function SearchableCombobox({
  value,
  onChange,
  items,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Tìm kiếm...',
  disabled = false,
  emptyText = 'Không tìm thấy',
  className,
  allowClear = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIdx, setHighlightedIdx] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedItem = items.find(i => i.value === value) ?? null

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setHighlightedIdx(-1)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Autofocus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
      setHighlightedIdx(-1)
    } else {
      setSearch('')
    }
  }, [open])

  // Filter items
  const filtered = search.trim()
    ? items.filter(
        i =>
          i.label.toLowerCase().includes(search.toLowerCase()) ||
          (i.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (i.group?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : items

  // Group items
  const groups: { group: string | null; items: ComboboxItem[] }[] = []
  const hasGroups = filtered.some(i => i.group)
  if (hasGroups) {
    const groupMap = new Map<string, ComboboxItem[]>()
    filtered.forEach(item => {
      const g = item.group ?? ''
      if (!groupMap.has(g)) groupMap.set(g, [])
      groupMap.get(g)!.push(item)
    })
    groupMap.forEach((groupItems, group) => {
      groups.push({ group: group || null, items: groupItems })
    })
  } else {
    groups.push({ group: null, items: filtered })
  }

  // Flat list for keyboard nav
  const flatFiltered = groups.flatMap(g => g.items)

  // Scroll highlighted into view
  useEffect(() => {
    if (highlightedIdx >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${highlightedIdx}"]`) as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIdx])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIdx(i => Math.min(i + 1, flatFiltered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIdx >= 0 && flatFiltered[highlightedIdx]) {
          onChange(flatFiltered[highlightedIdx].value)
          setOpen(false)
        }
      }
    },
    [open, highlightedIdx, flatFiltered, onChange]
  )

  function handleSelect(item: ComboboxItem) {
    onChange(item.value)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-blue-500 border-blue-400'
        )}
      >
        <span className={cn('truncate flex-1 text-left', !selectedItem && 'text-gray-400')}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <span className="flex items-center gap-1 ml-1 shrink-0">
          {allowClear && selectedItem && (
            <span
              role="button"
              tabIndex={-1}
              onMouseDown={handleClear}
              className="rounded hover:bg-gray-100 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Search box */}
          <div className="flex items-center border-b border-gray-100 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0 mr-1.5" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setHighlightedIdx(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onMouseDown={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400 text-center">{emptyText}</p>
            ) : (
              groups.map((grp, gi) => (
                <div key={gi}>
                  {grp.group && (
                    <p className="px-3 pt-2 pb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {grp.group}
                    </p>
                  )}
                  {grp.items.map(item => {
                    const flatIdx = flatFiltered.indexOf(item)
                    const isHighlighted = highlightedIdx === flatIdx
                    const isSelected = value === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        data-idx={flatIdx}
                        onMouseDown={() => handleSelect(item)}
                        onMouseEnter={() => setHighlightedIdx(flatIdx)}
                        className={cn(
                          'w-full flex items-start gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                          isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50',
                          isSelected && 'font-medium'
                        )}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{item.label}</span>
                          {item.description && (
                            <span className="block text-xs text-slate-500 truncate">{item.description}</span>
                          )}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
