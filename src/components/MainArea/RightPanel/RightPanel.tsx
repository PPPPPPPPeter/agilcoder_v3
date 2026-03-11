import { X } from 'lucide-react'
import type { AppState, AppAction } from '@/types'
import { ViewToggle } from './ViewToggle'
import { OverallStyleView } from './OverallStyleView/OverallStyleView'
import { FineTuneView } from './FineTuneView/FineTuneView'
import { ChatView } from './ChatView/ChatView'

interface RightPanelProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const LEVEL_DOT: Record<string, string> = {
  page: 'bg-panel-muted',
  section: 'bg-blue-400',
  element: 'bg-green-400',
  text: 'bg-yellow-400',
}

export function RightPanel({ state, dispatch }: RightPanelProps) {
  const {
    selectedVariantId, styleValues, rightPanelView,
    openAccordions, selectedElements, selectionTargets, prompt,
  } = state
  const primaryTarget = selectionTargets[selectionTargets.length - 1] ?? null
  const selectionCount = selectionTargets.length
  const currentValues = selectedVariantId ? styleValues[selectedVariantId] : undefined

  return (
    <div className="flex flex-col h-full bg-panel-surface border-l border-panel-border overflow-hidden">

      {/* Selection info strip — shown whenever elements are selected; persists across tab switches */}
      {primaryTarget && (
        <div className="px-3 py-1.5 border-b border-panel-border bg-panel-bg/50 flex items-center gap-2 flex-shrink-0">
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_DOT[primaryTarget.level] ?? 'bg-panel-muted'}`}
          />
          {selectionCount > 1 ? (
            <span className="font-mono text-xs text-gray-700 truncate flex-1 min-w-0">
              {selectionCount} elements selected
            </span>
          ) : (
            <span className="font-mono text-xs text-gray-700 truncate flex-1 min-w-0">
              {primaryTarget.label}
            </span>
          )}
          <span className="text-panel-muted capitalize flex-shrink-0" style={{ fontSize: 10 }}>
            {selectionCount > 1 ? 'multi' : primaryTarget.level}
          </span>
          <button
            onClick={() => dispatch({ type: 'SET_SELECTION_TARGETS', payload: [] })}
            className="text-panel-muted hover:text-gray-600 transition-colors flex-shrink-0"
            title="Clear selection"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* View toggle */}
      <div className="px-3 py-3 border-b border-panel-border flex-shrink-0">
        <ViewToggle
          view={rightPanelView}
          onChange={(v) => dispatch({ type: 'SET_RIGHT_PANEL_VIEW', payload: v })}
        />
      </div>

      {/* View content */}
      {rightPanelView === 'chat' ? (
        <ChatView hasGenerated={state.hasGenerated} />
      ) : rightPanelView === 'overall' ? (
        currentValues ? (
          <OverallStyleView
            prompt={prompt}
            variantId={selectedVariantId ?? ''}
            values={currentValues}
            openAccordions={openAccordions}
            dispatch={dispatch}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-panel-muted">Generate a style to see controls</p>
          </div>
        )
      ) : (
        <FineTuneView selectedElements={selectedElements} />
      )}
    </div>
  )
}
