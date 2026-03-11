// ---- Variants ----
export interface Variant {
  id: string
  label: string
  color: string
  accent: string
  style: string
  annotation?: 'like' | 'dislike'
}

// ---- History ----
export type PatchType = 'llm' | 'user'

export interface HistoryNode {
  id: number
  type: PatchType
  summary: string
  timestamp: number
}

// ---- Feedback Overlay ----
export interface AnnotatedElement {
  selector: string
  elementRef: HTMLElement
  reaction?: 'like' | 'dislike'
  comment?: string
}

// ---- CSS Groups ----
export type CSSGroupId =
  | 'color'
  | 'typography'
  | 'geometry'
  | 'spacing'
  | 'effects'
  | 'animation'

export interface CSSGroupDef {
  id: CSSGroupId
  label: string
  icon: string
  description: string
}

// ---- Style Values (per variant) ----
export interface StyleValues {
  masterIntensity: number
  // Color
  bgColor: string
  textColor: string
  accentPrimary: string
  accentSecondary: string
  contrast: number
  // Typography
  headingFont: string
  bodyFont: string
  baseSize: number
  lineHeight: number
  // Geometry
  borderRadius: number
  uniformRadius: boolean
  // Spacing
  density: number
  sectionGap: number
  // Effects
  shadowIntensity: number
  hoverLift: number
  backdropBlur: boolean
  // Animation
  transitionSpeed: number
  entranceAnimations: boolean
  hoverAnimations: boolean
}

// ---- Hierarchical Element Selection ----
export interface SelectionTarget {
  scopeId: string
  variantIndex: number
  contentPath: string | null        // JSON Pointer from nearest data-content-path attr
  cssSelector: string | null        // matched against extractSelectors(manifest.css)
  level: 'page' | 'section' | 'element' | 'text'
  label: string
  // Runtime-only (non-serializable — not persisted or sent to server):
  elementRef: HTMLElement
}

// ---- Fine-tune ----
export interface SelectedElement {
  selector: string
  parentChain: string[]
  properties: PropertyEntry[]
}

export interface PropertyEntry {
  name: string
  value: string
  originalValue: string
  category: CSSGroupId
  controlType: 'color' | 'slider' | 'dropdown' | 'toggle' | 'segmented'
  options?: string[]
  min?: number
  max?: number
  unit?: string
}

// ---- Content Presets ----
export type PresetCaseName = 'academic-homepage'

export interface ContentPreset {
  caseName: PresetCaseName
  presetName: string
  label: string
}

// ---- Manifest Rendering ----

/** Plain object returned by manifestRenderOne(). Passed as-is to PreviewContent. */
export interface RenderDescriptor {
  scopeId: string
  manifest: Record<string, unknown>
  caseName: string
  /** One of: 'classic' | 'sidebar-left' | 'sidebar-right' | 'hero-banner' | 'compact' */
  layout: string
  rootClass: string
  layoutClass: string
  /** Manifest css field scoped to #scopeId — injected via <style> tag. */
  scopedCSS: string
  content: Record<string, unknown>
  skeletonKey: string
}

// ---- Chat ----

/** A feedback annotation collected via feedback selection mode. */
export interface Annotation {
  id: string
  variantIndex: number
  target: SelectionTarget
  type: 'like' | 'dislike' | 'comment' | 'tweak'
  comment?: string
  /**
   * True when the user chose "Apply Now" in the ActionPopover.
   * Shown with a ⚡ badge in the annotation summary — signals that this
   * feedback is intended for immediate LLM regeneration.
   *
   * Future: when the LLM is integrated, annotations with immediate:true
   * can be dispatched right away without waiting for sendMessage().
   */
  immediate?: boolean
}

/** A single message in the chat history. */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  /** User's prompt text, or the AI summary string (e.g. "Generated 5 variants"). */
  text: string
  /** Annotations attached to a user message (bundled at send time). */
  annotations?: Annotation[]
  /** Which generation round this assistant message belongs to. */
  roundNumber?: number
  /** How many variants the assistant generated (assistant messages only). */
  variantCount?: number
  timestamp: number
}

// ---- App State ----
export type RightPanelView = 'overall' | 'finetune' | 'chat'

export interface AppState {
  prompt: string
  hasGenerated: boolean
  selectedVariantId: string | null
  variants: Variant[]
  selectedPreset: ContentPreset | null
  historyByVariant: Record<string, HistoryNode[]>
  currentHistoryIndex: Record<string, number>
  rightPanelView: RightPanelView
  panelLeftWidthPct: number
  feedbackModeActive: boolean
  annotatedElements: AnnotatedElement[]
  selectedElements: SelectedElement[]
  selectionTargets: SelectionTarget[]
  styleValues: Record<string, StyleValues>
  openAccordions: CSSGroupId[]
  previewZoomed: boolean
}

// ---- Actions ----
export type AppAction =
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'GENERATE_VARIANTS' }
  | { type: 'SELECT_VARIANT'; payload: string }
  | { type: 'SET_RIGHT_PANEL_VIEW'; payload: RightPanelView }
  | { type: 'SET_PANEL_WIDTH'; payload: number }
  | { type: 'TOGGLE_FEEDBACK_MODE' }
  | { type: 'TOGGLE_ELEMENT_ANNOTATION'; payload: AnnotatedElement }
  | { type: 'CLEAR_ANNOTATIONS' }
  | { type: 'SET_ELEMENT_REACTION'; payload: { selector: string; reaction: 'like' | 'dislike' } }
  | { type: 'SET_ELEMENT_COMMENT'; payload: { selector: string; comment: string } }
  | { type: 'UPDATE_STYLE_VALUE'; payload: { variantId: string; key: keyof StyleValues; value: StyleValues[keyof StyleValues] } }
  | { type: 'UPDATE_STYLE_VALUE_LIVE'; payload: { variantId: string; key: keyof StyleValues; value: StyleValues[keyof StyleValues] } }
  | { type: 'TOGGLE_ACCORDION'; payload: CSSGroupId }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'JUMP_TO_HISTORY'; payload: { variantId: string; index: number } }
  | { type: 'ADD_VARIANT_ANNOTATION'; payload: { variantId: string; annotation: 'like' | 'dislike' } }
  | { type: 'SELECT_PREVIEW_ELEMENT'; payload: SelectedElement | null }
  | { type: 'TOGGLE_ZOOM' }
  | { type: 'GENERATE_MORE_VARIANTS' }
  | { type: 'SELECT_PRESET'; payload: ContentPreset | null }
  | { type: 'SET_SELECTION_TARGETS'; payload: SelectionTarget[] }
  | { type: 'TOGGLE_MULTI_SELECT'; payload: SelectionTarget }
