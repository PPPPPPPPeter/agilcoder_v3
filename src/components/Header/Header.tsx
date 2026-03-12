import type { ContentPreset, AppAction } from '@/types'
import { PresetStrip } from './PresetStrip'
import { HeaderActions } from './HeaderActions'

interface HeaderProps {
  presets: ContentPreset[]
  selectedPreset: ContentPreset | null
  onSelectPreset: (preset: ContentPreset) => void
  dispatch: React.Dispatch<AppAction>
}

export function Header({ presets, selectedPreset, onSelectPreset, dispatch }: HeaderProps) {
  return (
    <header
      className="flex items-center bg-panel-surface border-b border-panel-border flex-shrink-0"
      style={{ height: 72 }}
    >
      <PresetStrip
        presets={presets}
        selectedPreset={selectedPreset}
        onSelect={onSelectPreset}
        dispatch={dispatch}
      />

      {/* Vertical divider */}
      <div className="h-8 w-px bg-panel-border flex-shrink-0" />

      <HeaderActions />
    </header>
  )
}
