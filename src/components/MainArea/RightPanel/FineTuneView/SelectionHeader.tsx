import type { SelectedElement } from '@/types'
import { ChevronRight } from 'lucide-react'

interface SelectionHeaderProps {
  elements: SelectedElement[]
}

export function SelectionHeader({ elements }: SelectionHeaderProps) {
  const primary = elements[0]
  const count = elements.length

  return (
    <div className="px-4 py-3 border-b border-panel-border">
      {count === 1 && primary ? (
        <>
          {/* Class chip */}
          <div className="inline-flex items-center gap-1 bg-accent/10 border border-accent/25 rounded px-2 py-0.5 mb-2">
            <span className="text-xs font-code text-accent">{primary.selector}</span>
          </div>

          {/* Breadcrumb */}
          {primary.parentChain.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {primary.parentChain.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-2xs font-code text-panel-muted">{crumb}</span>
                  {i < primary.parentChain.length - 1 && (
                    <ChevronRight size={10} className="text-panel-muted" />
                  )}
                </span>
              ))}
              <ChevronRight size={10} className="text-panel-muted" />
              <span className="text-2xs font-code text-gray-700">{primary.selector}</span>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-800 font-medium mb-2">{count} elements selected</p>
          <div className="flex flex-wrap gap-1">
            {elements.map(el => (
              <span
                key={el.selector}
                className="text-2xs font-code bg-accent/10 border border-accent/25 rounded px-1.5 py-0.5 text-accent"
              >
                {el.selector}
              </span>
            ))}
          </div>
          <p className="text-2xs text-panel-muted mt-1">Showing shared properties only</p>
        </>
      )}
    </div>
  )
}
