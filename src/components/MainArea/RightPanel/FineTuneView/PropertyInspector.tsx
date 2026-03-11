import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import type { SelectedElement } from '@/types'
import { PropertyRow } from './PropertyRow'

interface PropertyInspectorProps {
  elements: SelectedElement[]
}

export function PropertyInspector({ elements }: PropertyInspectorProps) {
  const [properties, setProperties] = useState(() => elements[0]?.properties ?? [])
  const [addOpen, setAddOpen] = useState(false)
  const [newProp, setNewProp] = useState('')

  // Sync properties when the selected element changes (fixes stale initializer)
  useEffect(() => {
    setProperties(elements[0]?.properties ?? [])
  }, [elements[0]?.selector])

  const handleChange = useCallback((name: string, value: string) => {
    setProperties(prev => prev.map(p => p.name === name ? { ...p, value } : p))
    console.log('[StyleAgent] Fine-tune patch:', { selector: elements[0]?.selector, property: name, value })
  }, [elements[0]?.selector])

  const handleReset = useCallback((name: string) => {
    setProperties(prev => prev.map(p => p.name === name ? { ...p, value: p.originalValue } : p))
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {properties.map(prop => (
          <PropertyRow
            key={prop.name}
            property={prop}
            onChange={handleChange}
            onReset={handleReset}
          />
        ))}
      </div>

      {/* Add property */}
      <div className="border-t border-panel-border p-3">
        {addOpen ? (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newProp}
              onChange={(e) => setNewProp(e.target.value)}
              placeholder="property-name"
              className="flex-1 bg-panel-bg border border-panel-border rounded px-2 py-1
                text-xs font-code text-gray-900 outline-none focus:border-accent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProp.trim()) {
                  setProperties(prev => [...prev, {
                    name: newProp.trim(),
                    value: '',
                    originalValue: '',
                    category: 'effects',
                    controlType: 'slider',
                  }])
                  setNewProp('')
                  setAddOpen(false)
                }
                if (e.key === 'Escape') setAddOpen(false)
              }}
            />
            <button
              onClick={() => setAddOpen(false)}
              className="text-xs text-panel-muted hover:text-gray-700 px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 text-xs text-panel-muted hover:text-gray-700 transition-colors"
          >
            <Plus size={12} />
            Add property
          </button>
        )}
      </div>
    </div>
  )
}
