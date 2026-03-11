import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { SendHorizonal } from 'lucide-react'
import { useChat } from '@/context/ChatContext'

interface ChatInputProps {
  hasGenerated: boolean
}

export function ChatInput({ hasGenerated }: ChatInputProps) {
  const { sendMessage, pendingAnnotations } = useChat()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const annotationCount = pendingAnnotations.length

  // Auto-resize textarea as content grows (max 3 rows)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`
  }, [text])

  const canSend = text.trim().length > 0 || annotationCount > 0

  const handleSend = () => {
    if (!canSend) return
    sendMessage(text.trim())
    setText('')
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const placeholder = hasGenerated
    ? 'Tell the AI what to change…'
    : 'Describe the style you want…'

  return (
    <div className="flex-shrink-0 border-t border-panel-border px-3 py-2.5 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none text-xs leading-relaxed bg-transparent outline-none text-gray-800 placeholder:text-panel-muted"
        style={{ minHeight: 24, maxHeight: 72, scrollbarWidth: 'none' }}
      />

      <button
        onClick={handleSend}
        disabled={!canSend}
        title={canSend ? 'Send (Enter)' : 'Type a message or add annotations to send'}
        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all
          ${canSend
            ? 'bg-accent text-white hover:bg-accent/90 shadow-sm'
            : 'bg-panel-border text-panel-muted cursor-not-allowed'
          }`}
      >
        <SendHorizonal size={13} />
        {annotationCount > 0 && (
          <span className="tabular-nums font-semibold text-xs tracking-tight">
            ({annotationCount})
          </span>
        )}
      </button>
    </div>
  )
}
