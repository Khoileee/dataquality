import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: React.ReactNode
  className?: string
  wide?: boolean
}

export function InfoTooltip({ text, className = '', wide = false }: InfoTooltipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; direction: 'top' | 'bottom' } | null>(null)
  const iconRef = useRef<HTMLSpanElement>(null)

  const handleEnter = useCallback(() => {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const direction = spaceBelow > 160 ? 'bottom' : rect.top > 160 ? 'top' : 'bottom'
    setCoords({
      left: rect.left + rect.width / 2,
      top: direction === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      direction,
    })
  }, [])

  return (
    <span
      ref={iconRef}
      className={`inline-flex items-center ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setCoords(null)}
    >
      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-blue-500 cursor-help transition-colors" />
      {coords && createPortal(
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: coords.left,
            top: coords.direction === 'bottom' ? coords.top : undefined,
            bottom: coords.direction === 'top' ? window.innerHeight - coords.top : undefined,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          <div className={`${wide ? 'w-96' : 'w-72'} px-3 py-2 text-xs leading-relaxed text-white bg-gray-900 rounded-lg shadow-lg whitespace-pre-line`}>
            {text}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                ...(coords.direction === 'bottom'
                  ? { top: -5, borderBottom: '5px solid rgb(17 24 39)' }
                  : { bottom: -5, borderTop: '5px solid rgb(17 24 39)' }),
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}
