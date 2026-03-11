import type { RightPanelView } from '@/types'

interface ViewToggleProps {
  view: RightPanelView
  onChange: (view: RightPanelView) => void
}

const TAB_LABELS: Record<RightPanelView, string> = {
  overall: 'Style',
  finetune: 'Tweak',
  chat: 'Chat',
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex p-1 bg-panel-bg rounded-lg border border-panel-border">
      {(['overall', 'finetune', 'chat'] as RightPanelView[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors duration-150 font-medium
            ${view === v
              ? 'bg-panel-surface text-gray-900 shadow-sm'
              : 'text-panel-muted hover:text-gray-700'
            }`}
        >
          {TAB_LABELS[v]}
        </button>
      ))}
    </div>
  )
}
