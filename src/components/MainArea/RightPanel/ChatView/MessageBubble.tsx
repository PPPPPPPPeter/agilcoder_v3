import { useState } from 'react'
import { Paperclip, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import type { ChatMessage, Annotation } from '@/types'

// ─── Annotation type icons ────────────────────────────────────────────────────

function AnnotationIcon({ type }: { type: Annotation['type'] }) {
  if (type === 'like')    return <ThumbsUp size={11} className="text-green-500" />
  if (type === 'dislike') return <ThumbsDown size={11} className="text-red-400" />
  return <MessageSquare size={11} className="text-blue-400" />
}

// ─── Inline annotation list (expanded from badge) ────────────────────────────

function AnnotationList({ annotations }: { annotations: Annotation[] }) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      {annotations.map(a => (
        <div
          key={a.id}
          className="flex items-start gap-1.5 py-1 px-1.5 rounded bg-panel-bg/60 border border-panel-border/60"
        >
          <AnnotationIcon type={a.type} />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-panel-muted">
              Variant {a.variantIndex + 1} · {a.target.label}
            </span>
            {a.comment && (
              <p className="text-xs text-gray-600 mt-0.5 leading-tight">
                {a.comment}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── User message bubble ──────────────────────────────────────────────────────

function UserMessage({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false)
  const count = message.annotations?.length ?? 0

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="max-w-[90%] px-3 py-2 rounded-xl rounded-tr-sm text-xs leading-relaxed"
        style={{ background: 'rgba(99,102,241,0.10)', color: '#374151' }}
      >
        {message.text}
      </div>

      {count > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-panel-muted hover:text-gray-600 transition-colors"
        >
          <Paperclip size={11} />
          <span>{count} annotation{count !== 1 ? 's' : ''} attached</span>
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      )}

      {expanded && count > 0 && (
        <div className="w-full max-w-[90%]">
          <AnnotationList annotations={message.annotations!} />
        </div>
      )}
    </div>
  )
}

// ─── Assistant status card ────────────────────────────────────────────────────

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-start">
      <div
        className="px-3 py-2 rounded-xl rounded-tl-sm text-xs"
        style={{ background: 'rgba(15,17,23,0.05)', color: '#6b7280' }}
      >
        <span className="font-medium text-gray-700">
          {message.text}
        </span>
        {message.roundNumber != null && (
          <span className="ml-1.5 text-panel-muted">
            → Round {message.roundNumber}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Public component ────────────────────────────────────────────────────────

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') return <UserMessage message={message} />
  return <AssistantMessage message={message} />
}
