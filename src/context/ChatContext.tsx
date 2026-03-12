import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react'
import type { Annotation, ChatMessage, ContentPreset } from '@/types'
import type { Manifest } from '@/api/promptGenerator/types'
import { compileChatSendPrompt } from '@/api/promptGenerator/compileChatSendPrompt'
import { compileApplyNowPrompt } from '@/api/promptGenerator/compileApplyNowPrompt'
import { callLLM, hasApiKey } from '@/api/llmService'
import {
  parseGenerateVariantsResponse,
  parseRefineVariantsResponse,
  parseApplyNowResponse,
} from '@/api/llmResponseParser'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0
function generateId(): string {
  return `chat-${Date.now()}-${++_idCounter}`
}

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
  | { type: 'REMOVE_ANNOTATIONS_BY_VARIANT'; payload: number }
  | { type: 'CLEAR_PENDING_ANNOTATIONS' }
  | { type: 'INCREMENT_ROUND' }

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

    case 'REMOVE_ANNOTATIONS_BY_VARIANT': {
      const deletedIdx = action.payload
      // Remove all annotations for the deleted variant, then renumber remaining ones
      const surviving = state.pendingAnnotations
        .filter(a => a.variantIndex !== deletedIdx)
        .map(a =>
          a.variantIndex > deletedIdx
            ? { ...a, variantIndex: a.variantIndex - 1, target: { ...a.target, variantIndex: a.target.variantIndex - 1 } }
            : a,
        )
      return { ...state, pendingAnnotations: surviving }
    }

    case 'CLEAR_PENDING_ANNOTATIONS':
      return { ...state, pendingAnnotations: [] }

    case 'INCREMENT_ROUND':
      return { ...state, currentRound: state.currentRound + 1 }

    default:
      return state
  }
}

const initialState: ChatState = {
  messages: [],
  pendingAnnotations: [],
  currentRound: 0,
}

// ─── Context shape ────────────────────────────────────────────────────────────

/** Result returned by applyNow(). */
export interface ApplyNowResult {
  success: boolean
  appliedCount?: number
  error?: string
}

/** Metadata for a single LLM-generated variant. */
export interface VariantMeta {
  summary: string
  approach: string
}

interface ChatContextType {
  messages: ChatMessage[]
  pendingAnnotations: Annotation[]
  currentRound: number

  /** LLM-generated manifests for the current round. Indexed to match presets. */
  currentManifests: Manifest[]

  /** Summary and approach labels returned by the LLM, one per manifest. */
  variantMetadata: VariantMeta[]

  /** True while a callLLM() request is in-flight (Chat Send or Apply Now). */
  isLoading: boolean

  /**
   * Add a feedback annotation to the pending list.
   * Called by ActionPopover when user clicks 👍/👎/💬 on a selected element.
   */
  addAnnotation: (a: Annotation) => void

  /**
   * Remove a pending annotation by id.
   * Called from the × button on individual annotation items in the annotation summary.
   */
  removeAnnotation: (id: string) => void

  /**
   * Remove all data for a given variant index (annotations, manifests, metadata)
   * and renumber remaining annotations with higher indices.
   * Called when a variant is deleted from the header strip.
   */
  removeVariantData: (variantIndex: number) => void

  /**
   * Send a message to the LLM along with all pending annotations.
   * Compiles the prompt, calls the API, parses the response, updates state.
   * All errors are surfaced as assistant error messages in the chat.
   */
  sendMessage: (text: string) => Promise<void>

  /**
   * Apply Now: call the LLM to patch a specific variant in-place.
   * Returns { success, appliedCount, error } — never throws.
   * Called from ActionPopover / UIFeedbackPanel.
   */
  applyNow: (
    annotations: Annotation[],
    currentManifest: Manifest,
    variantIndex: number,
  ) => Promise<ApplyNowResult>

  /** Index of the variant whose thumbnail should be highlighted. */
  hoveredVariantIndex: number | null
  setHoveredVariantIndex: (idx: number | null) => void

  /**
   * When set, PreviewFrame will switch to the annotation's variant and flash it.
   * Set by clicking an annotation row in AnnotationSummary.
   */
  pendingNavigation: Annotation | null
  navigateToAnnotation: (a: Annotation) => void
  clearNavigation: () => void

  /**
   * When set, AnnotationSummary highlights the annotation row with this id.
   * Cleared by AnnotationSummary after the highlight animation completes.
   */
  highlightedAnnotationId: string | null
  setHighlightedAnnotationId: (id: string | null) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

interface ChatProviderProps {
  children: ReactNode
  /**
   * The currently selected preset from AppState.
   * Used by sendMessage() to derive caseName and contentPreset for PromptCompiler.
   * Updated on every render via a ref so the async callback always reads the latest value.
   */
  selectedPreset: ContentPreset | null
}

export function ChatProvider({ children, selectedPreset }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // ── Refs for stale-closure avoidance in async callbacks ──────────────────────
  // These are updated every render so async sendMessage/applyNow always read
  // the current values even if they were captured in a useCallback([]) closure.
  const stateRef = useRef(state)
  stateRef.current = state

  const selectedPresetRef = useRef(selectedPreset)
  selectedPresetRef.current = selectedPreset

  // ── LLM manifest state ───────────────────────────────────────────────────────
  const [_currentManifests, _setCurrentManifests] = useState<Manifest[]>([])
  const currentManifestsRef = useRef<Manifest[]>([])

  // Wrapper that keeps the ref in sync with state
  const setCurrentManifests = useCallback((manifests: Manifest[]) => {
    currentManifestsRef.current = manifests
    _setCurrentManifests(manifests)
  }, [])

  const [variantMetadata, setVariantMetadata] = useState<VariantMeta[]>([])

  // ── Loading state ────────────────────────────────────────────────────────────
  const [isLoading, _setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)

  const setIsLoading = (v: boolean) => {
    isLoadingRef.current = v
    _setIsLoading(v)
  }

  // ── Navigation / hover state ─────────────────────────────────────────────────
  const [hoveredVariantIndex, setHoveredVariantIndex] = useState<number | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<Annotation | null>(null)
  const [highlightedAnnotationId, setHighlightedAnnotationId] = useState<string | null>(null)

  const navigateToAnnotation = useCallback((a: Annotation) => setPendingNavigation(a), [])
  const clearNavigation     = useCallback(() => setPendingNavigation(null), [])

  // ── Annotation actions (synchronous) ─────────────────────────────────────────

  const addAnnotation = useCallback(
    (a: Annotation) => dispatch({ type: 'ADD_ANNOTATION', payload: a }),
    [],
  )

  const removeAnnotation = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ANNOTATION', payload: id }),
    [],
  )

  const removeVariantData = useCallback((variantIndex: number) => {
    // 1. Remove and renumber annotations
    dispatch({ type: 'REMOVE_ANNOTATIONS_BY_VARIANT', payload: variantIndex })
    // 2. Remove manifest at index
    const newManifests = currentManifestsRef.current.filter((_, i) => i !== variantIndex)
    setCurrentManifests(newManifests)
    // 3. Remove metadata at index
    setVariantMetadata(prev => prev.filter((_, i) => i !== variantIndex))
  }, [setCurrentManifests])

  // ── Chat Send (async) ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    // Prevent concurrent requests
    if (isLoadingRef.current) return

    // Capture state at call time via refs (avoids stale closure)
    const annotations = [...stateRef.current.pendingAnnotations]
    const manifests   = currentManifestsRef.current
    const history     = stateRef.current.messages
    const preset      = selectedPresetRef.current
    const caseName      = preset?.caseName    ?? 'academic-homepage'
    const contentPreset = preset?.presetName  ?? 'default'
    const nextRound   = stateRef.current.currentRound + 1

    // 1. Optimistic user message — appears in chat immediately
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      annotations: annotations.length > 0 ? [...annotations] : undefined,
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg })
    dispatch({ type: 'CLEAR_PENDING_ANNOTATIONS' })
    setIsLoading(true)

    try {
      // 2. Check API key
      if (!hasApiKey()) {
        throw new Error('Please set your Anthropic API key in Settings (⚙ icon).')
      }

      // 3. Compile prompt
      const prompt = compileChatSendPrompt({
        caseName,
        manifests,
        annotations,
        userInstruction: text,
        conversationHistory: history,
      })

      // 4. Call LLM
      const raw = await callLLM(prompt)

      // 5. Parse response — branch on scenario
      const isFirstRound    = manifests.length === 0
      const hasAnnotations  = annotations.length > 0

      let newManifests: Manifest[]
      let metadata: VariantMeta[]

      if (isFirstRound || (!hasAnnotations && text.trim())) {
        // Scenario 11: fresh generation
        const parsed = parseGenerateVariantsResponse(raw, caseName, contentPreset)
        if (!parsed.success && parsed.manifests.length === 0) {
          throw new Error(parsed.errors.join('; '))
        }
        newManifests = parsed.manifests
        metadata     = parsed.metadata
        if (parsed.errors.length > 0) {
          dispatch({ type: 'ADD_MESSAGE', payload: {
            id: generateId(),
            role: 'assistant',
            text: `⚠️ Some variants had issues:\n${parsed.errors.join('\n')}`,
            timestamp: Date.now(),
          }})
        }
      } else {
        // Scenarios 7–10: refinement with feedback
        const parsed = parseRefineVariantsResponse(raw, manifests)
        if (!parsed.success && parsed.manifests.length === 0) {
          throw new Error(parsed.errors.join('; '))
        }
        newManifests = parsed.manifests
        metadata     = parsed.metadata.map(m => ({ summary: m.summary, approach: m.approach }))
        if (parsed.conflicts.length > 0) {
          dispatch({ type: 'ADD_MESSAGE', payload: {
            id: generateId(),
            role: 'assistant',
            text: `⚠️ Conflicts detected:\n${parsed.conflicts.join('\n')}`,
            timestamp: Date.now(),
          }})
        }
        if (parsed.errors.length > 0) {
          dispatch({ type: 'ADD_MESSAGE', payload: {
            id: generateId(),
            role: 'assistant',
            text: `⚠️ Some patches were skipped:\n${parsed.errors.join('\n')}`,
            timestamp: Date.now(),
          }})
        }
      }

      // 6. Append to the cumulative strip — never replace previous variants.
      // Only applyNow() modifies in-place; sendMessage() always grows the list.
      const prevCount  = currentManifestsRef.current.length
      const totalCount = prevCount + newManifests.length
      setCurrentManifests([...currentManifestsRef.current, ...newManifests])
      setVariantMetadata(prev => [...prev, ...metadata])
      dispatch({ type: 'INCREMENT_ROUND' })

      // 7. Append assistant success message
      const variantWord  = newManifests.length === 1 ? 'variant' : 'variants'
      const summaryText  = prevCount === 0
        ? `Generated ${newManifests.length} ${variantWord}`
        : `Added ${newManifests.length} ${variantWord} → Round ${nextRound} (${totalCount} total)`
      dispatch({ type: 'ADD_MESSAGE', payload: {
        id: generateId(),
        role: 'assistant',
        text: summaryText,
        roundNumber: nextRound,
        variantCount: newManifests.length,
        timestamp: Date.now(),
      }})

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      dispatch({ type: 'ADD_MESSAGE', payload: {
        id: generateId(),
        role: 'assistant',
        text: `❌ ${msg}`,
        timestamp: Date.now(),
      }})
    } finally {
      setIsLoading(false)
    }
  }, [setCurrentManifests])

  // ── Apply Now (async) ─────────────────────────────────────────────────────────

  const applyNow = useCallback(async (
    annotations: Annotation[],
    currentManifest: Manifest,
    variantIndex: number,
  ): Promise<ApplyNowResult> => {
    try {
      if (!hasApiKey()) {
        return { success: false, error: 'Please set your Anthropic API key in Settings (⚙ icon).' }
      }

      const prompt = compileApplyNowPrompt({ manifest: currentManifest, annotations })
      const raw    = await callLLM(prompt)
      const parsed = parseApplyNowResponse(raw, currentManifest)

      if (!parsed.success && parsed.appliedCount === 0) {
        return {
          success: false,
          error: parsed.errors.length > 0
            ? parsed.errors.join('; ')
            : 'No patches could be applied.',
        }
      }

      // Replace the manifest at this variant index
      const updated = [...currentManifestsRef.current]
      updated[variantIndex] = parsed.manifest
      setCurrentManifests(updated)

      const msg = parsed.skippedCount > 0
        ? `Applied ${parsed.appliedCount} of ${parsed.appliedCount + parsed.skippedCount} changes (${parsed.skippedCount} skipped).`
        : undefined

      return { success: true, appliedCount: parsed.appliedCount, error: msg }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  }, [setCurrentManifests])

  // ── Context value ─────────────────────────────────────────────────────────────

  const value: ChatContextType = {
    messages:            state.messages,
    pendingAnnotations:  state.pendingAnnotations,
    currentRound:        state.currentRound,
    currentManifests:    _currentManifests,
    variantMetadata,
    isLoading,
    addAnnotation,
    removeAnnotation,
    removeVariantData,
    sendMessage,
    applyNow,
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
