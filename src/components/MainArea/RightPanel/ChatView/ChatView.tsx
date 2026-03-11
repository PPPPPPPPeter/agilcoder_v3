import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { MessageBubble } from './MessageBubble'
import { AnnotationSummary } from './AnnotationSummary'
import { ChatInput } from './ChatInput'

interface ChatViewProps {
  hasGenerated: boolean
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 flex-1 p-6 text-center">
      <div className="w-8 h-8 rounded-full bg-panel-border flex items-center justify-center">
        <MessageSquare size={14} className="text-panel-muted" />
      </div>
      <p className="text-sm text-panel-muted leading-relaxed">
        Describe the style you want, or make selections and add annotations first.
      </p>
    </div>
  )
}

// ─── Message history ──────────────────────────────────────────────────────────

function MessageHistory() {
  const { messages } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) return <ChatEmptyState />

  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0"
      style={{ scrollbarWidth: 'thin' }}
    >
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function ChatView({ hasGenerated }: ChatViewProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Scrollable message history */}
      <MessageHistory />

      {/* Pending annotation summary — hidden when none exist */}
      <AnnotationSummary />

      {/* Fixed input area */}
      <ChatInput hasGenerated={hasGenerated} />
    </div>
  )
}
