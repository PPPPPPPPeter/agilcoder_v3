import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import type { AnnotatedElement } from '@/types'

interface ElementAnnotationPillProps {
  element: AnnotatedElement
  position: { top: number; left: number; width: number }
  onReaction: (reaction: 'like' | 'dislike') => void
  onComment: (comment: string) => void
}

export function ElementAnnotationPill({
  element,
  position,
  onReaction,
  onComment,
}: ElementAnnotationPillProps) {
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setCommentText] = useState(element.comment ?? '')

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute z-40 flex flex-col gap-1"
      style={{
        top: position.top - 32,
        left: position.left + position.width - 90,
      }}
    >
      <div className="flex items-center gap-1 bg-panel-surface border border-panel-border rounded-full
        shadow-lg px-2 py-1">
        <button
          onClick={() => onReaction('like')}
          className={`text-xs w-5 h-5 flex items-center justify-center rounded-full transition-all
            ${element.reaction === 'like' ? 'bg-green-500' : 'hover:bg-black/5'}`}
          title="Like this element"
        >
          👍
        </button>
        <button
          onClick={() => onReaction('dislike')}
          className={`text-xs w-5 h-5 flex items-center justify-center rounded-full transition-all
            ${element.reaction === 'dislike' ? 'bg-red-500' : 'hover:bg-black/5'}`}
          title="Dislike this element"
        >
          👎
        </button>
        <button
          onClick={() => setCommentOpen(!commentOpen)}
          className={`w-5 h-5 flex items-center justify-center rounded-full transition-all
            ${commentOpen || element.comment ? 'text-accent' : 'text-panel-muted hover:bg-black/5'}`}
        >
          <MessageSquare size={10} />
        </button>
      </div>

      {commentOpen && (
        <div className="bg-panel-surface border border-panel-border rounded-lg shadow-lg p-2 w-48">
          <textarea
            autoFocus
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent text-xs text-gray-800 outline-none resize-none placeholder-panel-muted"
            rows={2}
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              onClick={() => setCommentOpen(false)}
              className="text-2xs text-panel-muted hover:text-gray-700 px-1"
            >
              Cancel
            </button>
            <button
              onClick={() => { onComment(commentText); setCommentOpen(false) }}
              className="text-2xs bg-accent text-white px-2 py-0.5 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
