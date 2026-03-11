import { createContext, useContext, useReducer, useCallback, useState, type ReactNode } from 'react'
import type { Annotation, ChatMessage } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0
function generateId(): string {
  return `chat-${Date.now()}-${++_idCounter}`
}

// ====== MOCK DATA — DELETE WHEN REAL DATA IS AVAILABLE ======
// Replace with: annotations pushed from ActionPopover via ChatContext.addAnnotation()
// when the user clicks 👍/👎/💬 on a selected element in feedback mode.
const MOCK_ANNOTATIONS: Annotation[] = [
  // {
  //   id: 'mock-1',
  //   variantIndex: 0,
  //   target: {
  //     scopeId: 'preview-container',
  //     variantIndex: 0,
  //     contentPath: null,
  //     cssSelector: null,
  //     level: 'element',
  //     label: '.nav-bar',
  //     elementRef: document.body, // placeholder — real ref provided by selection system
  //   },
  //   type: 'like',
  // },
  // {
  //   id: 'mock-2',
  //   variantIndex: 1,
  //   target: {
  //     scopeId: 'preview-container',
  //     variantIndex: 1,
  //     contentPath: null,
  //     cssSelector: null,
  //     level: 'text',
  //     label: '<h1>',
  //     elementRef: document.body,
  //   },
  //   type: 'comment',
  //   comment: 'Font feels too heavy',
  // },
  // {
  //   id: 'mock-3',
  //   variantIndex: 0,
  //   target: {
  //     scopeId: 'preview-container',
  //     variantIndex: 0,
  //     contentPath: null,
  //     cssSelector: null,
  //     level: 'section',
  //     label: '.hero-section',
  //     elementRef: document.body,
  //   },
  //   type: 'dislike',
  // },
]
// ====== END MOCK DATA ======

// ─── State & Reducer ─────────────────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[]
  pendingAnnotations: Annotation[]
  currentRound: number
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'REMOVE_ANNOTATION'; payload: string }
  | { type: 'SEND_MESSAGE'; payload: { text: string } }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'ADD_ANNOTATION':
      return {
        ...state,
        pendingAnnotations: [...state.pendingAnnotations, action.payload],
      }

    case 'REMOVE_ANNOTATION':
      return {
        ...state,
        pendingAnnotations: state.pendingAnnotations.filter(a => a.id !== action.payload),
      }

    case 'SEND_MESSAGE': {
      const { text } = action.payload
      const nextRound = state.currentRound + 1

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        text,
        annotations: state.pendingAnnotations.length > 0
          ? [...state.pendingAnnotations]
          : undefined,
        timestamp: Date.now(),
      }

      // ====== MOCK RESPONSE — DELETE WHEN LLM IS INTEGRATED ======
      // Replace with: actual LLM API call that takes { text, pendingAnnotations, currentManifests }
      // and returns new manifests. Wire into manifest rendering pipeline, then
      // append a real assistant message with the actual variant count.
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        text: `Generated 5 variants`,
        roundNumber: nextRound,
        variantCount: 5,
        timestamp: Date.now() + 1,
      }
      // ====== END MOCK RESPONSE ======

      return {
        ...state,
        messages: [...state.messages, userMsg, assistantMsg],
        pendingAnnotations: [],
        currentRound: nextRound,
      }
    }

    default:
      return state
  }
}

const initialState: ChatState = {
  messages: [],
  pendingAnnotations: MOCK_ANNOTATIONS,
  currentRound: 0,
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface ChatContextType {
  messages: ChatMessage[]
  pendingAnnotations: Annotation[]
  currentRound: number

  /**
   * Add a feedback annotation to the pending list.
   *
   * Current: can be called manually or by test harnesses.
   * Future: called by ActionPopover when user clicks 👍/👎/💬 on a selected
   * element in feedback mode. The annotation appears in the annotation summary
   * and is bundled with the next sendMessage() call.
   */
  addAnnotation: (a: Annotation) => void

  /**
   * Remove a pending annotation by id.
   *
   * Called from: the × button on individual annotation items in the
   * annotation summary section, allowing users to trim feedback before sending.
   */
  removeAnnotation: (id: string) => void

  /**
   * Send a message to the LLM along with all pending annotations.
   *
   * Current (mock): appends user message + mock assistant response to history,
   * clears pendingAnnotations, increments currentRound.
   *
   * Future: compile { text, pendingAnnotations, currentManifests } into a
   * structured prompt, call the LLM API, receive new manifests, pass them to
   * the manifest rendering pipeline, then append a real assistant message.
   *
   * Called from: the send button / Enter key in ChatInput.
   */
  sendMessage: (text: string) => void

  /**
   * Index (0-based) of the variant whose thumbnail should be highlighted
   * in the header strip. Set on mouseenter of an annotation row, cleared on
   * mouseleave. Used by PresetStrip / PresetThumbnail for visual sync.
   */
  hoveredVariantIndex: number | null
  setHoveredVariantIndex: (idx: number | null) => void

  /**
   * When set, PreviewFrame will switch to the annotation's variant and scroll
   * to + flash the annotated element. Set by clicking an annotation row in
   * AnnotationSummary; cleared by PreviewFrame after handling.
   */
  pendingNavigation: Annotation | null
  navigateToAnnotation: (a: Annotation) => void
  clearNavigation: () => void

  /**
   * When set, AnnotationSummary will auto-expand, scroll to, and briefly
   * highlight the annotation row with this id. Set when the user clicks an
   * already-annotated element in the preview (BUG 2 fix). Cleared by
   * AnnotationSummary after the highlight animation completes.
   */
  highlightedAnnotationId: string | null
  setHighlightedAnnotationId: (id: string | null) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const [hoveredVariantIndex, setHoveredVariantIndex] = useState<number | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<Annotation | null>(null)
  const [highlightedAnnotationId, setHighlightedAnnotationId] = useState<string | null>(null)

  const navigateToAnnotation = useCallback((a: Annotation) => setPendingNavigation(a), [])
  const clearNavigation = useCallback(() => setPendingNavigation(null), [])

  const addAnnotation = useCallback(
    (a: Annotation) => dispatch({ type: 'ADD_ANNOTATION', payload: a }),
    [],
  )

  const removeAnnotation = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ANNOTATION', payload: id }),
    [],
  )

  const sendMessage = useCallback(
    (text: string) => dispatch({ type: 'SEND_MESSAGE', payload: { text } }),
    [],
  )

  const value: ChatContextType = {
    messages: state.messages,
    pendingAnnotations: state.pendingAnnotations,
    currentRound: state.currentRound,
    addAnnotation,
    removeAnnotation,
    sendMessage,
    hoveredVariantIndex,
    setHoveredVariantIndex,
    pendingNavigation,
    navigateToAnnotation,
    clearNavigation,
    highlightedAnnotationId,
    setHighlightedAnnotationId,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
