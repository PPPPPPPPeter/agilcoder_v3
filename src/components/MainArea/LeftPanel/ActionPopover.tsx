import { ThumbsUp, ThumbsDown, MessageSquare, X, Pencil, Wrench, Layers } from 'lucide-react'
import { useState } from 'react'
import type { SelectionTarget, Annotation } from '@/types'
import { useChat } from '@/context/ChatContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0
function genId(): string {
  return `anno-${Date.now()}-${++_idCounter}`
}

const POPOVER_W = 196
const POPOVER_H_MAX = 230 // worst-case height estimate (with comment area)

function computePosition(
  el: HTMLElement,
  container: HTMLDivElement,
): { top: number; left: number } {
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()

  const elTop = elRect.top - cRect.top
  const elLeft = elRect.left - cRect.left
  const elRight = elRect.right - cRect.left

  const GAP = 8

  // Prefer: right side of element, aligned to element's top
  let left = elRight + GAP
  let top = elTop

  // Flip to left if too close to right edge
  if (left + POPOVER_W > cRect.width - 4) {
    left = elLeft - POPOVER_W - GAP
  }

  // If popover overflows below, anchor its bottom to the container bottom
  if (top + POPOVER_H_MAX > cRect.height - 4) {
    top = Math.max(4, cRect.height - POPOVER_H_MAX - 4)
  }

  // Clamp to container bounds
  left = Math.max(4, Math.min(left, cRect.width - POPOVER_W - 4))
  top = Math.max(4, top)

  return { top, left }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ActionPopoverProps {
  primaryTarget: SelectionTarget
  /** All currently selected targets. When length > 1, multi-select mode is active. */
  selectionTargets: SelectionTarget[]
  containerRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  /** When set (single-select only), the popover opens in edit mode: state is
   *  pre-populated from the existing annotation, and Attach replaces it instead
   *  of creating a new one. */
  existingAnnotation?: Annotation
}

export function ActionPopover({
  primaryTarget,
  selectionTargets,
  containerRef,
  onClose,
  existingAnnotation,
}: ActionPopoverProps) {
  const { addAnnotation, removeAnnotation } = useChat()

  const isMultiSelect = selectionTargets.length > 1
  // Edit mode is only meaningful in single-select
  const isEditing = !isMultiSelect && existingAnnotation !== undefined

  // Pre-populate from existing annotation when in edit mode.
  // Because ActionPopover is given a fresh `key` by PreviewFrame whenever the
  // selected element changes, useState initializers always run with the correct
  // existingAnnotation for that element.
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(
    isEditing && (existingAnnotation?.type === 'like' || existingAnnotation?.type === 'dislike')
      ? existingAnnotation!.type
      : null,
  )
  const [commentActive, setCommentActive] = useState(
    isEditing
      ? (existingAnnotation!.type === 'comment' || !!existingAnnotation!.comment)
      : false,
  )
  const [comment, setComment] = useState(isEditing ? (existingAnnotation!.comment ?? '') : '')

  const container = containerRef.current
  if (!container) return null

  const pos = computePosition(primaryTarget.elementRef, container)

  const toggleReaction = (r: 'like' | 'dislike') => {
    setReaction(prev => (prev === r ? null : r))
  }

  const toggleComment = () => {
    setCommentActive(prev => {
      if (prev) setComment('') // clear text when closing comment area
      return !prev
    })
  }

  // Attach: reaction chosen OR non-empty comment text
  const canAttach = reaction !== null || (commentActive && comment.trim().length > 0)
  // Apply Now: requires non-empty comment text (reaction alone is not sufficient)
  const canApplyNow = commentActive && comment.trim().length > 0

  // Build an annotation object for a given target
  const buildAnnotation = (target: SelectionTarget): Annotation => ({
    id: genId(),
    variantIndex: target.variantIndex,
    target,
    type: reaction ?? 'comment',
    comment: commentActive && comment.trim() ? comment.trim() : undefined,
  })

  const handleAttach = () => {
    if (!canAttach) return

    if (isMultiSelect) {
      // Create one annotation per selected target
      for (const target of selectionTargets) {
        addAnnotation(buildAnnotation(target))
      }
    } else {
      // Single-select: in edit mode, replace the existing annotation
      if (existingAnnotation) removeAnnotation(existingAnnotation.id)
      addAnnotation(buildAnnotation(primaryTarget))
    }
    onClose()
  }

  const handleApplyNow = () => {
    if (!canApplyNow) return
    // ====== MOCK — DELETE WHEN LLM IS INTEGRATED ======
    // Replace with: LLM call to regenerate the targeted element(s).
    // Input: comment text + selectionTargets (or primaryTarget in single mode)
    //        + current manifests from context.
    // Output: a patch (or set of patches) to apply via PatchEngine.
    // Apply Now intentionally does NOT create Chat-tab annotations.
    // ====== END MOCK ======
    onClose()
  }

  const handleTweak = () => {
    if (isMultiSelect) {
      // Create a tweak annotation for each selected target
      for (const target of selectionTargets) {
        addAnnotation({
          id: genId(),
          variantIndex: target.variantIndex,
          target,
          type: 'tweak',
        })
      }
    } else {
      if (existingAnnotation) removeAnnotation(existingAnnotation.id)
      addAnnotation({
        id: genId(),
        variantIndex: primaryTarget.variantIndex,
        target: primaryTarget,
        type: 'tweak',
      })
    }
    onClose()
  }

  return (
    <div
      data-no-intercept
      className="absolute z-50 bg-panel-surface border border-panel-border rounded-lg shadow-xl"
      style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
    >
      {/* ── Header: element label / multi-select count + edit indicator + close ── */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1.5">
        {isMultiSelect ? (
          <span className="flex items-center gap-1 text-xs text-accent font-medium flex-1 min-w-0">
            <Layers size={11} className="flex-shrink-0" />
            <span>{selectionTargets.length} elements selected</span>
          </span>
        ) : (
          <span className="text-xs text-panel-muted font-mono truncate flex-1">
            {primaryTarget.label}
          </span>
        )}
        {isEditing && (
          <span
            className="flex items-center gap-0.5 text-xs text-amber-500 flex-shrink-0 mr-1.5"
            title="Editing existing annotation"
          >
            <Pencil size={10} />
          </span>
        )}
        <button
          onClick={onClose}
          className="text-panel-muted hover:text-gray-400 flex-shrink-0 transition-colors"
          title="Close"
        >
          <X size={11} />
        </button>
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

      {/* ── Comment textarea (only visible when 💬 is toggled) ── */}
      {commentActive && (
        <div className="px-2.5 pb-2">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={isMultiSelect ? 'Comment for all selected…' : 'Add a comment…'}
            rows={2}
            className="w-full text-xs bg-panel-bg border border-panel-border rounded p-1.5 text-gray-700 placeholder:text-panel-muted resize-none outline-none focus:border-accent/50 transition-colors"
            style={{ scrollbarWidth: 'none' }}
          />
        </div>
      )}

      {/* ── Action buttons: Attach | Apply Now ── */}
      <div className="flex gap-1.5 px-2.5 pt-1 pb-1.5 border-t border-panel-border/50">
        <button
          onClick={handleAttach}
          disabled={!canAttach}
          className={`flex-1 py-1 rounded text-xs font-medium transition-all
            ${canAttach
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-panel-border text-panel-muted cursor-not-allowed opacity-50'
            }`}
        >
          {isEditing ? 'Update' : isMultiSelect ? `Attach ${selectionTargets.length}` : 'Attach'}
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

      {/* ── Tweak button: always enabled — no reaction/comment required ── */}
      <div className="px-2.5 pb-2.5">
        <button
          onClick={handleTweak}
          className="w-full flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium
            bg-panel-bg border border-panel-border/70 text-panel-muted
            hover:border-violet-400/60 hover:text-violet-500 transition-all"
          title={
            isMultiSelect
              ? `Mark all ${selectionTargets.length} selected elements for tweaking`
              : 'Mark this element for tweaking without a specific reaction'
          }
        >
          <Wrench size={11} />
          <span>{isMultiSelect ? `Tweak ${selectionTargets.length}` : 'Tweak'}</span>
        </button>
      </div>

    </div>
  )
}
