import { RotateCcw } from 'lucide-react'
import type { PropertyEntry } from '@/types'
import { ColorSwatch } from '@/primitives/ColorSwatch'
import { Dropdown } from '@/primitives/Dropdown'
import { Slider } from '@/primitives/Slider'
import { Toggle } from '@/primitives/Toggle'

interface PropertyRowProps {
  property: PropertyEntry
  onChange: (name: string, value: string) => void
  onReset: (name: string) => void
}

export function PropertyRow({ property, onChange, onReset }: PropertyRowProps) {
  const isModified = property.value !== property.originalValue

  const renderControl = () => {
    switch (property.controlType) {
      case 'color':
        return (
          <ColorSwatch
            color={property.value}
            onChange={(c) => onChange(property.name, c)}
          />
        )
      case 'slider':
        return (
          <div className="w-24">
            <Slider
              value={parseFloat(property.value) || 0}
              min={property.min ?? 0}
              max={property.max ?? 100}
              onChange={(v) => onChange(property.name, `${Math.round(v)}${property.unit ?? ''}`)}
            />
          </div>
        )
      case 'toggle':
        return (
          <Toggle
            checked={property.value === 'block' || property.value === 'true'}
            onChange={(v) => onChange(property.name, v ? 'block' : 'none')}
          />
        )
      case 'segmented':
        return (
          <div className="flex gap-0.5">
            {(property.options ?? []).map(opt => (
              <button
                key={opt}
                onClick={() => onChange(property.name, opt)}
                className={`px-1.5 py-0.5 text-2xs rounded transition-colors
                  ${property.value === opt
                    ? 'bg-accent text-white'
                    : 'bg-panel-border text-panel-muted hover:text-gray-700'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )
      case 'dropdown':
        return (
          <Dropdown
            value={property.value}
            options={property.options ?? []}
            onChange={(v) => onChange(property.name, v)}
          />
        )
    }
  }

  return (
    <div className="flex items-center gap-2 py-2 px-4 hover:bg-black/[0.02] transition-colors group">
      <span className={`text-2xs font-code flex-1 min-w-0 truncate ${isModified ? 'text-accent' : 'text-panel-muted'}`}>
        {property.name}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {renderControl()}

        <button
          onClick={() => onReset(property.name)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5
            ${isModified ? 'text-accent' : 'text-panel-muted'}`}
          title="Reset to original"
        >
          <RotateCcw size={10} />
        </button>
      </div>
    </div>
  )
}
