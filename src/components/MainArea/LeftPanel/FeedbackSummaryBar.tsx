import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send } from 'lucide-react'
import type { AnnotatedElement } from '@/types'

interface FeedbackSummaryBarProps {
  elements: AnnotatedElement[]
  onClear: () => void
}

export function FeedbackSummaryBar({ elements, onClear }: FeedbackSummaryBarProps) {
  const [comment, setComment] = useState('')

  const handleSend = () => {
    console.log('[StyleAgent] Send to LLM:', {
      elements: elements.map(el => ({
        selector: el.selector,
        reaction: el.reaction,
        comment: el.comment,
      })),
      unifiedComment: comment,
    })
    setComment('')
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-4 left-4 right-4 z-50 bg-panel-surface border border-panel-border
        rounded-xl shadow-xl p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-800">
          {elements.length} element{elements.length !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClear}
          className="text-panel-muted hover:text-gray-700 transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe what to change across all selected elements..."
          className="flex-1 bg-panel-bg border border-panel-border rounded px-2 py-1.5
            text-xs text-gray-800 placeholder-panel-muted outline-none focus:border-accent"
        />
        <button
          onClick={handleSend}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover
            text-xs text-white rounded transition-colors flex-shrink-0"
        >
          <Send size={11} />
          Send to LLM
        </button>
      </div>
    </motion.div>
  )
}
