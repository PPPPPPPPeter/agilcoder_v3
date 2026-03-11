import { LayoutTemplate } from 'lucide-react'
import type { AppState, AppAction } from '@/types'
import { PreviewFrame } from './PreviewFrame'

interface LeftPanelProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export function LeftPanel({ state, dispatch }: LeftPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {!state.selectedPreset ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 bg-preview-bg">
          <div className="w-14 h-14 rounded-2xl bg-panel-border/60 flex items-center justify-center">
            <LayoutTemplate size={24} className="text-panel-muted" />
          </div>
          <p className="text-sm text-panel-muted">Select a layout preset from the header</p>
        </div>
      ) : (
        <PreviewFrame state={state} dispatch={dispatch} />
      )}
    </div>
  )
}
