import { MessageSquare, Monitor } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Tooltip } from '@/primitives/Tooltip'

interface FloatingControlsProps {
  feedbackModeActive: boolean
  onToggleFeedback: () => void
  /** Whether the UI-level feedback panel is currently open. */
  uiFeedbackOpen: boolean
  /** Toggle the UI-level feedback panel. Only relevant when feedbackModeActive. */
  onToggleUIFeedback: () => void
}

export function FloatingControls({
  feedbackModeActive,
  onToggleFeedback,
  uiFeedbackOpen,
  onToggleUIFeedback,
}: FloatingControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-40 flex flex-col items-center gap-2" data-no-intercept>

      {/* UI-feedback toggle — only visible while feedback mode is active */}
      <AnimatePresence>
        {feedbackModeActive && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
          >
            <Tooltip content="Rate entire UI" placement="left">
              <button
                onClick={onToggleUIFeedback}
                className={`w-8 h-8 flex items-center justify-center border rounded-lg
                  transition-all shadow-md
                  ${uiFeedbackOpen
                    ? 'bg-accent/15 border-accent/50 text-accent shadow-accent/10'
                    : 'bg-panel-surface border-panel-border text-panel-muted hover:text-gray-700 hover:border-accent'
                  }`}
              >
                <Monitor size={14} />
              </button>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback mode toggle */}
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
