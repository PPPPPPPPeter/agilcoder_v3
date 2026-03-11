import { useRef } from 'react'
import type { AppState, AppAction } from '@/types'
import { usePanelResizer } from '@/hooks/usePanelResizer'
import { LeftPanel } from './LeftPanel/LeftPanel'
import { PanelResizer } from './PanelResizer'
import { RightPanel } from './RightPanel/RightPanel'

interface MainAreaProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export function MainArea({ state, dispatch }: MainAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { handleMouseDown } = usePanelResizer(
    containerRef,
    (pct) => dispatch({ type: 'SET_PANEL_WIDTH', payload: pct }),
  )

  const leftPct = state.panelLeftWidthPct

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden"
    >
      {/* Left Panel */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: `${leftPct}%` }}
      >
        <LeftPanel state={state} dispatch={dispatch} />
      </div>

      {/* Resizer */}
      <PanelResizer onMouseDown={handleMouseDown} />

      {/* Right Panel */}
      <div className="flex-1 overflow-hidden">
        <RightPanel state={state} dispatch={dispatch} />
      </div>
    </div>
  )
}
