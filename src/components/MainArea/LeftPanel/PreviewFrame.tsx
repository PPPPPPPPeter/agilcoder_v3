import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppState, AppAction, SelectionTarget, Annotation, RenderDescriptor } from '@/types'
import type { Manifest } from '@/api/promptGenerator/types'
import { PreviewContent } from './MockAcademicPage'
import { FeedbackOverlay } from './FeedbackOverlay'
import { SelectionBreadcrumb } from './SelectionBreadcrumb'
import { FloatingControls } from './FloatingControls'
import { ActionPopover } from './ActionPopover'
import { UIFeedbackPanel } from './UIFeedbackPanel'
import { useChat } from '@/context/ChatContext'
// @ts-ignore — JS module; types handled by PreviewContent wrapper
import { getPreset, createManifest, manifestRenderOne } from '@/api/manifestRenderingEng/index.js'

// Maps each content preset to its canonical layout name (used to build the manifest)
const PRESET_LAYOUT_MAP: Record<string, string> = {
  'default':             'classic',
  'senior-professor':    'sidebar-left',
  'industry-researcher': 'hero-banner',
  'early-career':        'compact',
  'interdisciplinary':   'sidebar-right',
}

// ─── Flash helper ─────────────────────────────────────────────────────────────

/**
 * Scrolls an element into view then briefly highlights it with an amber
 * inset box-shadow that fades out over ~0.8 s. Uses box-shadow rather
 * than outline so it doesn't conflict with the selection system.
 */
function flashElement(el: HTMLElement): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  // Instant-on amber flash
  el.style.transition = 'none'
  el.style.boxShadow = 'inset 0 0 0 3px #f59e0b'
  // Two rAF ticks to force a paint before starting the transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transition = 'box-shadow 0.8s ease-out'
      el.style.boxShadow = 'inset 0 0 0 0px rgba(245,158,11,0)'
    })
  })
  // Final cleanup so no inline styles linger
  setTimeout(() => {
    el.style.boxShadow = ''
    el.style.transition = ''
  }, 1000)
}

/**
 * Re-queries the DOM element described by a SelectionTarget inside the given
 * container. Used after a variant switch, when the original elementRef is
 * detached. Tries data-content-path first, then cssSelector.
 */
function queryAnnotationElement(target: SelectionTarget, container: HTMLElement): HTMLElement | null {
  if (target.contentPath) {
    try {
      const el = container.querySelector<HTMLElement>(`[data-content-path="${target.contentPath}"]`)
      if (el) return el
    } catch {}
  }
  if (target.cssSelector) {
    try {
      const el = container.querySelector<HTMLElement>(target.cssSelector)
      if (el) return el
    } catch {}
  }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PreviewFrameProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export function PreviewFrame({ state, dispatch }: PreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedPreset, feedbackModeActive, selectionTargets, presets } = state

  // Primary selection = most recently added (last in array); drives breadcrumb + popover
  const primaryTarget = selectionTargets[selectionTargets.length - 1] ?? null

  // Variant index: 0-based index of the selected preset in the live presets list
  const variantIndex = selectedPreset
    ? Math.max(0, presets.findIndex(
        p => p.caseName === selectedPreset.caseName && p.presetName === selectedPreset.presetName,
      ))
    : 0

  const { pendingAnnotations, pendingNavigation, clearNavigation, currentManifests, applyNow } = useChat()

  // Build a full RenderDescriptor for the selected preset.
  // Priority: LLM-generated manifest for this variant index → preset fallback with empty CSS.
  // useMemo keeps scopeId stable (no random suffix) so the <style> tag doesn't thrash.
  const descriptor = useMemo<RenderDescriptor | null>(() => {
    if (!selectedPreset) return null

    const scopeIdFn = () => `scope-${selectedPreset.caseName}-${selectedPreset.presetName}`

    // Use the LLM-generated manifest if available for this variant index
    const llmManifest = currentManifests[variantIndex] as Manifest | undefined
    if (llmManifest) {
      return manifestRenderOne(llmManifest, {
        generateScopeId: scopeIdFn,
      }) as RenderDescriptor
    }

    // Fallback: build from preset content with empty CSS (before first LLM round)
    const content = getPreset(selectedPreset.caseName, selectedPreset.presetName)
    const layout  = PRESET_LAYOUT_MAP[selectedPreset.presetName] ?? 'classic'
    const manifest = createManifest({
      caseName: selectedPreset.caseName,
      preset:   selectedPreset.presetName,
      content,
      layout,
      css: '',
    })
    return manifestRenderOne(manifest, {
      generateScopeId: scopeIdFn,
    }) as RenderDescriptor
  }, [selectedPreset, currentManifests, variantIndex])

  // ── Apply Now callback ───────────────────────────────────────────────────────

  /**
   * Called by ActionPopover and UIFeedbackPanel when the user clicks "Apply Now".
   * Compiles the prompt, calls the LLM, applies patches, and updates the manifest.
   * Returns a result object so the caller can show loading/error state.
   */
  const handleApplyNow = useCallback(async (annotations: Annotation[]) => {
    if (!descriptor) return { success: false as const, error: 'No manifest available.' }

    // Use LLM manifest if available; fall back to descriptor's manifest
    const manifest = (currentManifests[variantIndex] ?? descriptor.manifest) as unknown as Manifest
    const result   = await applyNow(annotations, manifest, variantIndex)

    // Flash annotated elements on success to give visual feedback
    if (result.success) {
      for (const ann of annotations) {
        if (ann.target.level !== 'page' && ann.target.elementRef !== document.body) {
          flashElement(ann.target.elementRef)
        }
      }
    }

    return result
  }, [descriptor, currentManifests, variantIndex, applyNow])

  // ── Annotation navigation (from Chat tab click) ──────────────────────────────

  // Holds an annotation that needs to be flashed after a variant switch settles.
  const pendingFlashRef = useRef<Annotation | null>(null)

  useEffect(() => {
    if (!pendingNavigation) return

    const targetPreset = presets[pendingNavigation.variantIndex]
    if (!targetPreset) {
      clearNavigation()
      return
    }

    const alreadyOnTarget =
      selectedPreset?.caseName === targetPreset.caseName &&
      selectedPreset?.presetName === targetPreset.presetName

    if (alreadyOnTarget) {
      // DOM is current — try the stored elementRef first, then re-query.
      const container = containerRef.current
      const el = pendingNavigation.target.elementRef
      if (el !== document.body && container && container.contains(el)) {
        flashElement(el)
      } else if (container) {
        const queried = queryAnnotationElement(pendingNavigation.target, container)
        if (queried) flashElement(queried)
      }
      clearNavigation()
    } else {
      // Need to switch variant first. Save the annotation so the post-switch
      // effect can re-query the element once the new DOM is mounted.
      pendingFlashRef.current = pendingNavigation
      dispatch({ type: 'SELECT_PRESET', payload: targetPreset })
      clearNavigation()
    }
  }, [pendingNavigation, clearNavigation, selectedPreset, dispatch, presets])

  // After a variant switch, flash the element once the new DOM has settled.
  useEffect(() => {
    const annotation = pendingFlashRef.current
    if (!annotation) return
    pendingFlashRef.current = null

    // The AnimatePresence transition is 0.15 s; wait a little longer for the
    // new DOM to be fully painted before querying.
    const timerId = setTimeout(() => {
      const container = containerRef.current
      if (!container) return
      const el = queryAnnotationElement(annotation.target, container)
      if (el) flashElement(el)
    }, 250)

    return () => clearTimeout(timerId)
  }, [selectedPreset])

  // ── UI Feedback Panel visibility ─────────────────────────────────────────────
  // Controlled by the Monitor button in FloatingControls. Auto-closes when
  // feedback mode is turned off.
  const [uiFeedbackOpen, setUiFeedbackOpen] = useState(false)
  useEffect(() => {
    if (!feedbackModeActive) setUiFeedbackOpen(false)
  }, [feedbackModeActive])

  // ── Action Popover visibility ────────────────────────────────────────────────
  // Reset "dismissed" whenever the primary target changes to a different element,
  // so the popover auto-opens again for each newly selected element.
  const [popoverDismissed, setPopoverDismissed] = useState(false)
  const prevElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const currentEl = primaryTarget?.elementRef ?? null
    if (currentEl !== prevElementRef.current) {
      prevElementRef.current = currentEl
      setPopoverDismissed(false)
    }
  }, [primaryTarget])

  // Show popover when: feedback mode is on + something is selected + not dismissed
  const showPopover = feedbackModeActive && primaryTarget !== null && !popoverDismissed

  // ── Existing annotation for current selection (drives ActionPopover edit mode) ─
  const existingAnnotation =
    selectionTargets.length === 1 && primaryTarget
      ? pendingAnnotations.find(a =>
          (a.target.cssSelector && primaryTarget.cssSelector &&
           a.target.cssSelector === primaryTarget.cssSelector &&
           a.variantIndex === primaryTarget.variantIndex) ||
          a.target.elementRef === primaryTarget.elementRef,
        )
      : undefined

  // ── Selection callbacks ──────────────────────────────────────────────────────

  // Replace all selections with one element.
  const handleSelect = useCallback(
    (target: SelectionTarget) => dispatch({ type: 'SET_SELECTION_TARGETS', payload: [target] }),
    [dispatch],
  )
  // Toggle element in/out of multi-select set (Shift+click)
  const handleMultiSelect = useCallback(
    (target: SelectionTarget) => dispatch({ type: 'TOGGLE_MULTI_SELECT', payload: target }),
    [dispatch],
  )
  // Clear all selections
  const handleClear = useCallback(
    () => dispatch({ type: 'SET_SELECTION_TARGETS', payload: [] }),
    [dispatch],
  )

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-preview-bg"
    >
      {/* Preview content */}
      <div className="w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPreset ? `${selectedPreset.caseName}/${selectedPreset.presetName}` : 'empty'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            {selectedPreset && descriptor && (
              <PreviewContent descriptor={descriptor} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback overlay — mounts only when feedback mode is on.
          Attaches capture-phase click + hover listeners directly to containerRef.
          Returns null (no DOM output). Cleanup auto-runs on unmount. */}
      <AnimatePresence>
        {feedbackModeActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* Subtle blue tint signals selection mode is active */}
            <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
            <FeedbackOverlay
              containerRef={containerRef}
              selectionTargets={selectionTargets}
              variantIndex={variantIndex}
              onSelect={handleSelect}
              onMultiSelect={handleMultiSelect}
              onClear={handleClear}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Popover — appears when feedback mode is on and an element is selected.
          Anchored near the selected element's bounding box. Dismissed via × button or
          by selecting a different element (which auto-reopens it for the new selection).
          has data-no-intercept so its clicks bypass the capture-phase FeedbackOverlay. */}
      {showPopover && primaryTarget && (
        <ActionPopover
          key={`${primaryTarget.cssSelector ?? primaryTarget.label}-v${primaryTarget.variantIndex}`}
          primaryTarget={primaryTarget}
          selectionTargets={selectionTargets}
          existingAnnotation={existingAnnotation}
          containerRef={containerRef}
          onClose={() => setPopoverDismissed(true)}
          onApplyNow={handleApplyNow}
        />
      )}

      {/* UI Feedback Panel — anchored above-left of the FloatingControls button column.
          Opened by the Monitor button in FloatingControls. Keyed by variantIndex so it
          resets when the user switches to a different variant. */}
      <AnimatePresence>
        {feedbackModeActive && uiFeedbackOpen && selectedPreset && descriptor && (
          <motion.div
            key={`ui-feedback-${variantIndex}`}
            className="absolute bottom-4 right-14 z-40"
            data-no-intercept
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <UIFeedbackPanel
              variantIndex={variantIndex}
              scopeId={descriptor.scopeId}
              containerRef={containerRef}
              onApplyNow={handleApplyNow}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection breadcrumb — shows the primary (most recently clicked) selection. */}
      <AnimatePresence>
        {primaryTarget && (
          <motion.div
            className="absolute top-0 left-0 right-0"
            style={{ zIndex: 40 }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            data-no-intercept
          >
            <SelectionBreadcrumb
              selectionTarget={primaryTarget}
              containerRef={containerRef}
              onSelect={handleSelect}
              onClear={handleClear}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating controls */}
      <FloatingControls
        feedbackModeActive={feedbackModeActive}
        onToggleFeedback={() => dispatch({ type: 'TOGGLE_FEEDBACK_MODE' })}
        uiFeedbackOpen={uiFeedbackOpen}
        onToggleUIFeedback={() => setUiFeedbackOpen(o => !o)}
      />
    </div>
  )
}
