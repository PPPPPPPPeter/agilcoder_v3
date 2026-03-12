import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Annotation } from '@/types'
import { useChat } from '@/context/ChatContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0
function genId(): string {
  return `ui-anno-${Date.now()}-${++_idCounter}`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface UIFeedbackPanelProps {
  /** 0-based index of the currently active preset/variant. */
  variantIndex: number
  /** scopeId of the current RenderDescriptor — used as the target's scopeId. */
  scopeId: string
  /** Ref to the preview container — used as the target's elementRef. */
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Floating panel for leaving whole-UI feedback — independent of element selection.
 * Launched by the UI-feedback button in FloatingControls.
 * Creates a page-level annotation (target.level === 'page') when Attach is clicked.
 * No Tweak / edit-mode — page-level feedback cannot be fine-tuned at element granularity.
 */
export function UIFeedbackPanel({ variantIndex, scopeId, containerRef }: UIFeedbackPanelProps) {
  const { addAnnotation, removeAnnotation, pendingAnnotations } = useChat()

  // Pre-populate from any existing page-level annotation for this variant so the
  // user can see what they previously selected. Attaching will silently replace it.
  const existingAnnotation: Annotation | undefined = pendingAnnotations.find(
    a => a.target.level === 'page' && a.variantIndex === variantIndex,
  )

  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(
    existingAnnotation?.type === 'like' || existingAnnotation?.type === 'dislike'
      ? existingAnnotation.type
      : null,
  )
  const [commentActive, setCommentActive] = useState(
    existingAnnotation
      ? (existingAnnotation.type === 'comment' || !!existingAnnotation.comment)
      : false,
  )
  const [comment, setComment] = useState(existingAnnotation?.comment ?? '')

  // Sync state whenever the existing annotation is created, replaced, or removed
  // (e.g. user deletes it from the Chat tab). Parent gives a new `key` on variant switch.
  useEffect(() => {
    setReaction(
      existingAnnotation?.type === 'like' || existingAnnotation?.type === 'dislike'
        ? existingAnnotation.type
        : null,
    )
    setCommentActive(
      existingAnnotation
        ? (existingAnnotation.type === 'comment' || !!existingAnnotation.comment)
        : false,
    )
    setComment(existingAnnotation?.comment ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingAnnotation?.id])

  const canAttach  = reaction !== null || (commentActive && comment.trim().length > 0)
  const canApplyNow = commentActive && comment.trim().length > 0

  const buildPageTarget = () => ({
    scopeId,
    variantIndex,
    contentPath: null,
    cssSelector: null,
    level: 'page' as const,
    label: 'Entire UI',
    elementRef: containerRef.current ?? document.body,
  })

  const handleAttach = () => {
    if (!canAttach) return
    if (existingAnnotation) removeAnnotation(existingAnnotation.id)
    addAnnotation({
      id: genId(),
      variantIndex,
      target: buildPageTarget(),
      type: reaction ?? 'comment',
      comment: commentActive && comment.trim() ? comment.trim() : undefined,
    })
    setReaction(null)
    setCommentActive(false)
    setComment('')
  }

  const handleApplyNow = () => {
    if (!canApplyNow) return
    // ====== MOCK — DELETE WHEN LLM IS INTEGRATED ======
    // Replace with: LLM call to regenerate the entire variant.
    // Apply Now intentionally does NOT create a Chat-tab annotation.
    // ====== END MOCK ======
    setReaction(null)
    setCommentActive(false)
    setComment('')
  }

  const toggleReaction = (r: 'like' | 'dislike') =>
    setReaction(prev => (prev === r ? null : r))

  const toggleComment = () => {
    setCommentActive(prev => {
      if (prev) setComment('')
      return !prev
    })
  }

  return (
    <div
      data-no-intercept
      className="bg-panel-surface border border-panel-border rounded-lg shadow-xl"
      style={{ width: 196 }}
    >
      {/* ── Header ── */}
      <div className="px-2.5 pt-2 pb-1.5">
        <span className="text-xs text-panel-muted font-mono">Entire UI</span>
      </div>

      {/* ── Reaction row: 👍 👎 💬 ── */}
      <div className="flex items-center gap-1 px-2.5 pb-2">
        <button
          onClick={() => toggleReaction('like')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all
            ${reaction === 'like'
              ? 'bg-green-500/15 text-green-500 ring-1 ring-green-500/40'
              : 'text-panel-muted hover:text-gray-600 hover:bg-panel-bg/60'
            }`}
        >
          <ThumbsUp size={11} />
          <span>Like</span>
        </button>

        <button
          onClick={() => toggleReaction('dislike')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all
            ${reaction === 'dislike'
              ? 'bg-red-500/15 text-red-400 ring-1 ring-red-400/40'
              : 'text-panel-muted hover:text-gray-600 hover:bg-panel-bg/60'
            }`}
        >
          <ThumbsDown size={11} />
          <span>Dislike</span>
        </button>

        <button
          onClick={toggleComment}
          title="Comment"
          className={`px-2 py-1 rounded text-xs transition-all
            ${commentActive
              ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-400/40'
              : 'text-panel-muted hover:text-gray-600 hover:bg-panel-bg/60'
            }`}
        >
          <MessageSquare size={11} />
        </button>
      </div>

      {/* ── Comment textarea ── */}
      {commentActive && (
        <div className="px-2.5 pb-2">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Comment on the entire UI…"
            rows={2}
            className="w-full text-xs bg-panel-bg border border-panel-border rounded p-1.5 text-gray-700 placeholder:text-panel-muted resize-none outline-none focus:border-accent/50 transition-colors"
            style={{ scrollbarWidth: 'none' }}
          />
        </div>
      )}

      {/* ── Attach | Apply Now ── */}
      <div className="flex gap-1.5 px-2.5 pt-1 pb-2.5 border-t border-panel-border/50">
        <button
          onClick={handleAttach}
          disabled={!canAttach}
          className={`flex-1 py-1 rounded text-xs font-medium transition-all
            ${canAttach
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-panel-border text-panel-muted cursor-not-allowed opacity-50'
            }`}
        >
          Attach
        </button>

        <button
          onClick={handleApplyNow}
          disabled={!canApplyNow}
          className={`flex-1 py-1 rounded text-xs font-medium transition-all
            ${canApplyNow
              ? 'bg-panel-bg border border-panel-border text-gray-600 hover:border-accent/50 hover:text-accent'
              : 'bg-panel-border text-panel-muted cursor-not-allowed opacity-50'
            }`}
        >
          Apply Now
        </button>
      </div>
    </div>
  )
}
