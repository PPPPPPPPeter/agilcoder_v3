import type { ContentPreset } from '@/types'
import { PresetStrip } from './PresetStrip'
import { HeaderActions } from './HeaderActions'

interface HeaderProps {
  selectedPreset: ContentPreset | null
  onSelectPreset: (preset: ContentPreset) => void
}

export function Header({ selectedPreset, onSelectPreset }: HeaderProps) {
  return (
    <header
      className="flex items-center bg-panel-surface border-b border-panel-border flex-shrink-0"
      style={{ height: 72 }}
    >
      <PresetStrip selectedPreset={selectedPreset} onSelect={onSelectPreset} />

      {/* Vertical divider */}
      <div className="h-8 w-px bg-panel-border flex-shrink-0" />

      <HeaderActions />
    </header>
  )
}
