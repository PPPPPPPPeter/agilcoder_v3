import { useRef } from 'react'
import type { ContentPreset, PresetCaseName } from '@/types'
import { PresetThumbnail } from './PresetThumbnail'
import { useChat } from '@/context/ChatContext'

// The 5 academic preset descriptors
const PRESETS: ContentPreset[] = [
  { caseName: 'academic-homepage', presetName: 'default',             label: 'PhD Student'   },
  { caseName: 'academic-homepage', presetName: 'senior-professor',    label: 'Professor'     },
  { caseName: 'academic-homepage', presetName: 'industry-researcher', label: 'Industry Res.' },
  { caseName: 'academic-homepage', presetName: 'early-career',        label: 'Early Career'  },
  { caseName: 'academic-homepage', presetName: 'interdisciplinary',   label: 'Postdoc'       },
]

interface PresetStripProps {
  selectedPreset: ContentPreset | null
  onSelect: (preset: ContentPreset) => void
}

export function PresetStrip({ selectedPreset, onSelect }: PresetStripProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const { hoveredVariantIndex } = useChat()

  const handleWheel = (e: React.WheelEvent) => {
    if (stripRef.current) {
      e.preventDefault()
      stripRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-panel-surface to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-panel-surface to-transparent z-10 pointer-events-none" />

      <div
        ref={stripRef}
        className="flex items-center gap-5 h-full overflow-x-auto scrollbar-none px-6"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onWheel={handleWheel}
      >
        {PRESETS.map((preset, index) => (
          <PresetThumbnail
            key={`${preset.caseName}/${preset.presetName}`}
            preset={preset}
            isSelected={
              selectedPreset?.caseName === preset.caseName &&
              selectedPreset?.presetName === preset.presetName
            }
            isHovered={hoveredVariantIndex === index}
            index={index}
            onClick={() => onSelect(preset)}
          />
        ))}
      </div>
    </div>
  )
}

// Re-export the list so other components can use it if needed
export { PRESETS }

// Keep type re-export for convenience
export type { PresetCaseName }
