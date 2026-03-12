import { useRef } from 'react'
import type { ContentPreset, PresetCaseName, AppAction } from '@/types'
import { PresetThumbnail } from './PresetThumbnail'
import { useChat } from '@/context/ChatContext'
import { INITIAL_PRESETS } from '@/hooks/useAppState'

interface PresetStripProps {
  /** Live (possibly trimmed) preset list from AppState. */
  presets: ContentPreset[]
  selectedPreset: ContentPreset | null
  onSelect: (preset: ContentPreset) => void
  dispatch: React.Dispatch<AppAction>
}

export function PresetStrip({ presets, selectedPreset, onSelect, dispatch }: PresetStripProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const { hoveredVariantIndex, removeVariantData, variantMetadata, isLoading } = useChat()

  const handleWheel = (e: React.WheelEvent) => {
    if (stripRef.current) {
      e.preventDefault()
      stripRef.current.scrollLeft += e.deltaY
    }
  }

  const handleDelete = (index: number) => {
    const preset = presets[index]
    const confirmed = window.confirm(
      `Delete "Variant ${index + 1}: ${preset.label}"?\n\n` +
      `All associated feedback, annotations, and AI-generated styles for this variant will also be permanently removed.`,
    )
    if (!confirmed) return
    // Remove annotations, manifests, and metadata first (renumbers survivors),
    // then remove the preset from AppState
    removeVariantData(index)
    dispatch({ type: 'DELETE_PRESET', payload: index })
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
        {presets.map((preset, index) => (
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
            onDelete={() => handleDelete(index)}
            // LLM metadata: approach label + summary tooltip (undefined before first generation)
            approach={variantMetadata[index]?.approach}
            summary={variantMetadata[index]?.summary}
            // Disable switching variants while LLM is generating
            disabled={isLoading}
          />
        ))}
      </div>
    </div>
  )
}

// Re-export the initial static list as PRESETS for any code that still references it
export { INITIAL_PRESETS as PRESETS }

// Keep type re-export for convenience
export type { PresetCaseName }
