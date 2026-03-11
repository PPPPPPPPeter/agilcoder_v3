import { useReducer } from 'react'
import type { AppState, AppAction, CSSGroupId } from '@/types'

let nextHistoryId = 100

const initialState: AppState = {
  prompt: '',
  hasGenerated: false,
  selectedVariantId: null,
  variants: [],
  selectedPreset: null,
  historyByVariant: {},
  currentHistoryIndex: {},
  rightPanelView: 'overall',
  panelLeftWidthPct: 60,
  feedbackModeActive: false,
  annotatedElements: [],
  selectedElements: [],
  selectionTargets: [],
  styleValues: {},
  openAccordions: [],
  previewZoomed: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload }

    // TODO: Replace with real API call — returns variants from backend
    case 'GENERATE_VARIANTS':
      return {
        ...state,
        hasGenerated: true,
        variants: [],
        selectedVariantId: null,
        styleValues: {},
        historyByVariant: {},
        currentHistoryIndex: {},
        feedbackModeActive: false,
        annotatedElements: [],
        selectedElements: [],
      }

    case 'SELECT_VARIANT':
      return {
        ...state,
        selectedVariantId: action.payload,
        feedbackModeActive: false,
        annotatedElements: [],
        selectedElements: [],
      }

    case 'SET_RIGHT_PANEL_VIEW':
      return { ...state, rightPanelView: action.payload }

    case 'SET_PANEL_WIDTH':
      return { ...state, panelLeftWidthPct: action.payload }

    case 'TOGGLE_FEEDBACK_MODE':
      // Per spec: selection state is preserved when toggling off; highlight UI just hides
      return {
        ...state,
        feedbackModeActive: !state.feedbackModeActive,
      }

    case 'TOGGLE_ELEMENT_ANNOTATION': {
      const existing = state.annotatedElements.find(el => el.selector === action.payload.selector)
      if (existing) {
        return {
          ...state,
          annotatedElements: state.annotatedElements.filter(el => el.selector !== action.payload.selector),
        }
      }
      return {
        ...state,
        annotatedElements: [...state.annotatedElements, action.payload],
      }
    }

    case 'CLEAR_ANNOTATIONS':
      return { ...state, annotatedElements: [] }

    case 'SET_ELEMENT_REACTION':
      return {
        ...state,
        annotatedElements: state.annotatedElements.map(el =>
          el.selector === action.payload.selector
            ? { ...el, reaction: action.payload.reaction }
            : el
        ),
      }

    case 'SET_ELEMENT_COMMENT':
      return {
        ...state,
        annotatedElements: state.annotatedElements.map(el =>
          el.selector === action.payload.selector
            ? { ...el, comment: action.payload.comment }
            : el
        ),
      }

    case 'UPDATE_STYLE_VALUE': {
      const { variantId, key, value } = action.payload
      const currentIndex = state.currentHistoryIndex[variantId] ?? 0
      const existingHistory = state.historyByVariant[variantId] ?? []
      const trimmedHistory = existingHistory.slice(0, currentIndex + 1)
      const newNode = {
        id: nextHistoryId++,
        type: 'user' as const,
        summary: `Updated ${String(key)}`,
        timestamp: Date.now(),
      }

      return {
        ...state,
        styleValues: {
          ...state.styleValues,
          [variantId]: {
            ...state.styleValues[variantId],
            [key]: value,
          },
        },
        historyByVariant: {
          ...state.historyByVariant,
          [variantId]: [...trimmedHistory, newNode],
        },
        currentHistoryIndex: {
          ...state.currentHistoryIndex,
          [variantId]: trimmedHistory.length,
        },
      }
    }

    case 'UPDATE_STYLE_VALUE_LIVE': {
      // Updates value without writing to history (for live slider drag)
      const { variantId, key, value } = action.payload
      return {
        ...state,
        styleValues: {
          ...state.styleValues,
          [variantId]: {
            ...state.styleValues[variantId],
            [key]: value,
          },
        },
      }
    }

    case 'TOGGLE_ACCORDION': {
      const id = action.payload as CSSGroupId
      const open = state.openAccordions.includes(id)
      return {
        ...state,
        openAccordions: open
          ? state.openAccordions.filter(a => a !== id)
          : [...state.openAccordions, id],
      }
    }

    case 'UNDO': {
      if (!state.selectedVariantId) return state
      const idx = state.currentHistoryIndex[state.selectedVariantId] ?? 0
      if (idx <= 0) return state
      return {
        ...state,
        currentHistoryIndex: {
          ...state.currentHistoryIndex,
          [state.selectedVariantId]: idx - 1,
        },
      }
    }

    case 'REDO': {
      if (!state.selectedVariantId) return state
      const idx = state.currentHistoryIndex[state.selectedVariantId] ?? 0
      const history = state.historyByVariant[state.selectedVariantId] ?? []
      if (idx >= history.length - 1) return state
      return {
        ...state,
        currentHistoryIndex: {
          ...state.currentHistoryIndex,
          [state.selectedVariantId]: idx + 1,
        },
      }
    }

    case 'JUMP_TO_HISTORY':
      return {
        ...state,
        currentHistoryIndex: {
          ...state.currentHistoryIndex,
          [action.payload.variantId]: action.payload.index,
        },
      }

    case 'ADD_VARIANT_ANNOTATION':
      return {
        ...state,
        variants: state.variants.map(v =>
          v.id === action.payload.variantId
            ? { ...v, annotation: action.payload.annotation }
            : v
        ),
      }

    case 'SELECT_PREVIEW_ELEMENT':
      return {
        ...state,
        selectedElements: action.payload ? [action.payload] : [],
        rightPanelView: action.payload ? 'finetune' : state.rightPanelView,
      }

    case 'TOGGLE_ZOOM':
      return { ...state, previewZoomed: !state.previewZoomed }

    // TODO: Replace with real API call — appends more variants from backend
    case 'GENERATE_MORE_VARIANTS':
      return state

    case 'SELECT_PRESET':
      return { ...state, selectedPreset: action.payload }

    case 'SET_SELECTION_TARGETS':
      return { ...state, selectionTargets: action.payload }

    case 'TOGGLE_MULTI_SELECT': {
      const exists = state.selectionTargets.some(t => t.elementRef === action.payload.elementRef)
      return {
        ...state,
        selectionTargets: exists
          ? state.selectionTargets.filter(t => t.elementRef !== action.payload.elementRef)
          : [...state.selectionTargets, action.payload],
      }
    }

    default:
      return state
  }
}

export function useAppState() {
  return useReducer(appReducer, initialState)
}
