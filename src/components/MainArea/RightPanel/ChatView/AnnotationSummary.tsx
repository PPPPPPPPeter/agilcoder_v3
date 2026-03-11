import { useState, useEffect } from 'react'
import { Paperclip, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageSquare, X, Zap, Wrench } from 'lucide-react'
import type { Annotation } from '@/types'
import { useChat } from '@/context/ChatContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function annotationIcon(type: Annotation['type']) {
  if (type === 'like')    return <ThumbsUp size={12} className="text-green-500 flex-shrink-0" />
  if (type === 'dislike') return <ThumbsDown size={12} className="text-red-400 flex-shrink-0" />
  if (type === 'tweak')   return <Wrench size={12} className="text-violet-500 flex-shrink-0" />
  return <MessageSquare size={12} className="text-blue-400 flex-shrink-0" />
}

function variantCount(annotations: Annotation[]): number {
  return new Set(annotations.map(a => a.variantIndex)).size
}

// ─── Individual annotation row ────────────────────────────────────────────────

function AnnotationRow({ annotation, isHighlighted }: { annotation: Annotation; isHighlighted: boolean }) {
  const { removeAnnotation, setHoveredVariantIndex, navigateToAnnotation } = useChat()
  return (
    <div
      data-annotation-id={annotation.id}
      className={`flex items-start gap-1.5 px-2 py-1.5 rounded group/row cursor-pointer transition-colors duration-300 ${
        isHighlighted
          ? 'bg-amber-50 ring-1 ring-amber-300'
          : 'hover:bg-panel-bg/60'
      }`}
      onMouseEnter={() => setHoveredVariantIndex(annotation.variantIndex)}
      onMouseLeave={() => setHoveredVariantIndex(null)}
      onClick={() => navigateToAnnotation(annotation)}
      title="Jump to this element in the preview"
    >
      {annotationIcon(annotation.type)}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-panel-muted leading-tight flex items-center gap-1 flex-wrap">
          <span>Variant {annotation.variantIndex + 1}</span>
          <span className="text-gray-400">·</span>
          <span className="font-mono text-gray-600">{annotation.target.label}</span>
          {annotation.immediate && (
            <span
              className="inline-flex items-center gap-0.5 text-amber-500"
              title="Queued for immediate LLM application (Apply Now)"
            >
              <Zap size={10} />
            </span>
          )}
        </p>
        {annotation.comment && (
          <p className="text-xs text-gray-600 mt-0.5 leading-tight">
            "{annotation.comment}"
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); removeAnnotation(annotation.id) }}
        className="opacity-0 group-hover/row:opacity-100 text-panel-muted hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
        title="Remove annotation"
      >
        <X size={11} />
      </button>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function AnnotationSummary() {
  const { pendingAnnotations, highlightedAnnotationId, setHighlightedAnnotationId } = useChat()
  const [expanded, setExpanded] = useState(false)

  // BUG 2 fix: when an already-annotated element is clicked in the preview,
  // auto-expand the list, scroll the target row into view, and clear the
  // highlight after the animation plays out.
  useEffect(() => {
    if (!highlightedAnnotationId) return

    setExpanded(true)

    // Wait one rAF for React to render the expanded list, then scroll.
    const rafId = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-annotation-id="${highlightedAnnotationId}"]`,
      )
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    const timerId = setTimeout(() => setHighlightedAnnotationId(null), 1500)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timerId)
    }
  }, [highlightedAnnotationId, setHighlightedAnnotationId])

  if (pendingAnnotations.length === 0) return null

  const count = pendingAnnotations.length
  const variants = variantCount(pendingAnnotations)

  return (
    <div className="flex-shrink-0 border-t border-panel-border">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-panel-bg/50 transition-colors text-left"
      >
        <Paperclip size={13} className="text-panel-muted flex-shrink-0" />
        <span className="flex-1 text-xs text-panel-muted">
          <span className="font-semibold text-gray-700">{count}</span>
          {' '}annotation{count !== 1 ? 's' : ''} on{' '}
          <span className="font-semibold text-gray-700">{variants}</span>
          {' '}variant{variants !== 1 ? 's' : ''}
        </span>
        {expanded
          ? <ChevronUp size={13} className="text-panel-muted flex-shrink-0" />
          : <ChevronDown size={13} className="text-panel-muted flex-shrink-0" />
        }
      </button>

      {/* Expanded annotation list */}
      {expanded && (
        <div
          className="max-h-40 overflow-y-auto pb-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {pendingAnnotations.map(a => (
            <AnnotationRow
              key={a.id}
              annotation={a}
              isHighlighted={highlightedAnnotationId === a.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
