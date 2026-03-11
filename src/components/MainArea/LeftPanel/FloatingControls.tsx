import { MessageSquare } from 'lucide-react'
import { Tooltip } from '@/primitives/Tooltip'

interface FloatingControlsProps {
  feedbackModeActive: boolean
  onToggleFeedback: () => void
}

export function FloatingControls({
  feedbackModeActive,
  onToggleFeedback,
}: FloatingControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2" data-no-intercept>
      <Tooltip content={feedbackModeActive ? 'Exit feedback mode' : 'Feedback mode'} placement="left">
        <button
          onClick={onToggleFeedback}
          className={`w-8 h-8 flex items-center justify-center border rounded-lg
            transition-all shadow-md
            ${feedbackModeActive
              ? 'bg-accent border-accent text-white shadow-accent/20'
              : 'bg-panel-surface border-panel-border text-panel-muted hover:text-gray-700 hover:border-accent'
            }`}
        >
          <MessageSquare size={14} />
        </button>
      </Tooltip>
    </div>
  )
}
