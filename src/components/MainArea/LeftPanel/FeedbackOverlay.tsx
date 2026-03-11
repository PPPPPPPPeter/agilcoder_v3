import { useEffect, useRef } from 'react'
import type { SelectionTarget } from '@/types'

// ─── Tailwind prefix detector ────────────────────────────────────────────────
const TW_RE =
  /^(text|bg|p[xylrtb]?|m[xylrtb]?|flex|grid|col|row|gap|space|w|h|min|max|items|justify|font|leading|tracking|border|rounded|shadow|overflow|cursor|z|opacity|transition|animate|transform|scale|rotate|translate|top|left|right|bottom|inset|block|inline|hidden|relative|absolute|fixed|sticky|sr|truncate|divide|ring|select|pointer|aspect|object|size|not|fill|stroke|decoration|columns|auto|float|clear|italic|underline|uppercase|lowercase|capitalize|normal)-/

function isTwClass(cls: string): boolean {
  return TW_RE.test(cls) || /^(md|lg|sm|xl|2xl|dark|hover|focus|active|disabled|group|peer|first|last|odd|even):/.test(cls)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLabel(el: HTMLElement): string {
  if (el.dataset.contentPath) {
    const parts = el.dataset.contentPath.split('/')
    return parts[parts.length - 1] || el.tagName.toLowerCase()
  }
  const semantic = [...el.classList].find(c => !isTwClass(c))
  if (semantic) return `.${semantic}`
  if (el.id) return `#${el.id}`
  return `<${el.tagName.toLowerCase()}>`
}

function getLevel(el: HTMLElement, container: HTMLElement): SelectionTarget['level'] {
  if (el === container) return 'page'
  const tag = el.tagName.toLowerCase()
  if (['section', 'main', 'nav', 'header', 'footer', 'article', 'aside'].includes(tag)) return 'section'
  if ([...el.classList].some(c => !isTwClass(c) && /-section$|-bar$|-hero$|-wrapper$|-container$/.test(c))) return 'section'
  if (['span', 'a', 'strong', 'em', 'b', 'i', 'label', 'code'].includes(tag)) return 'text'
  if (tag === 'p' && el.children.length === 0) return 'text'
  return 'element'
}

function getContentPath(el: HTMLElement): string | null {
  let cur: HTMLElement | null = el
  while (cur) {
    if (cur.dataset.contentPath) return cur.dataset.contentPath
    cur = cur.parentElement
  }
  return null
}

/**
 * Builds a CSS selector that re-locates `el` inside `container` after a
 * variant switch re-mounts the DOM. Strategy (first match wins):
 * 1. data-content-path attribute
 * 2. Element ID
 * 3. First non-Tailwind class that is unique within container
 * 4. Tag name if unique within container
 * 5. nth-of-type path from container root
 */
function buildCssSelector(el: HTMLElement, container: HTMLElement): string {
  if (el === container) return '*:first-child'

  if (el.dataset.contentPath) {
    return `[data-content-path="${el.dataset.contentPath}"]`
  }

  if (el.id) {
    return `#${CSS.escape(el.id)}`
  }

  for (const cls of el.classList) {
    if (!isTwClass(cls)) {
      const sel = `.${CSS.escape(cls)}`
      try {
        if (container.querySelectorAll(sel).length === 1) return sel
      } catch {}
    }
  }

  const tag = el.tagName.toLowerCase()
  if (container.querySelectorAll(tag).length === 1) return tag

  // Build an nth-of-type path relative to the container
  const parts: string[] = []
  let cur: HTMLElement | null = el
  while (cur && cur !== container) {
    const t = cur.tagName.toLowerCase()
    const parent = cur.parentElement
    if (!parent) break
    const sameTag = [...parent.children].filter(s => s.tagName === cur!.tagName)
    if (sameTag.length === 1) {
      parts.unshift(t)
    } else {
      parts.unshift(`${t}:nth-of-type(${sameTag.indexOf(cur) + 1})`)
    }
    cur = parent
  }
  return parts.join(' > ')
}

function buildTarget(el: HTMLElement, container: HTMLElement, variantIndex: number): SelectionTarget {
  return {
    scopeId: container.id || 'preview-container',
    variantIndex,
    contentPath: getContentPath(el),
    cssSelector: buildCssSelector(el, container),
    level: getLevel(el, container),
    label: el === container ? 'Page' : getLabel(el),
    elementRef: el,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FeedbackOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  selectionTargets: SelectionTarget[]
  variantIndex: number                             // index of currently active preset (0-based)
  onSelect: (target: SelectionTarget) => void      // replace all with one
  onMultiSelect: (target: SelectionTarget) => void // toggle in multi-select
  onClear: () => void
}

/**
 * Attaches capture-phase click + hover-hint listeners directly to the preview
 * container. Returns null — no DOM output. Per spec: no overlay div, no
 * elementFromPoint, just direct event targeting via e.target.
 *
 * Shift+click adds/removes an element from the multi-select set.
 * Regular click replaces all selections with the clicked element.
 */
export function FeedbackOverlay({
  containerRef,
  selectionTargets,
  variantIndex,
  onSelect,
  onMultiSelect,
  onClear,
}: FeedbackOverlayProps) {
  // Stable ref to current selections — used inside event handlers to avoid
  // re-attaching listeners on every selection change.
  const targetsRef = useRef(selectionTargets)
  useEffect(() => { targetsRef.current = selectionTargets }, [selectionTargets])

  // Stable ref to variantIndex — lets click handler always use the latest preset
  // without needing to re-attach on every preset switch.
  const variantIndexRef = useRef(variantIndex)
  useEffect(() => { variantIndexRef.current = variantIndex }, [variantIndex])

  const isSelected = (el: HTMLElement) =>
    targetsRef.current.some(t => t.elementRef === el)

  // ── Effect 1: cursor + hover outline (mouseover / mouseout) ──────────────
  // Purely cosmetic per spec — no overlay, no elementFromPoint.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.style.cursor = 'crosshair'
    let hovered: HTMLElement | null = null

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!container.contains(el) || el === hovered) return
      // Clear previous hover outline — but never touch a selected element's amber outline
      if (hovered && !isSelected(hovered)) {
        hovered.style.outline = ''
      }
      hovered = el
      // Only show blue dashed hint if element is not already selected
      if (!isSelected(el)) {
        el.style.outline = '1px dashed rgba(59,130,246,0.5)'
      }
    }

    const onOut = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el === hovered) {
        // Preserve the amber outline on selected elements
        if (!isSelected(el)) {
          el.style.outline = ''
        }
        hovered = null
      }
    }

    container.addEventListener('mouseover', onOver)
    container.addEventListener('mouseout', onOut)

    return () => {
      container.removeEventListener('mouseover', onOver)
      container.removeEventListener('mouseout', onOut)
      if (hovered && !isSelected(hovered)) { hovered.style.outline = '' }
      hovered = null
      container.style.cursor = ''
    }
  }, [containerRef]) // stable: only runs once per mount

  // ── Effect 2: capture-phase click — suppress default interactions + select ─
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      // Let clicks on overlay UI elements (FloatingControls, breadcrumb) pass through
      if (el.closest('[data-no-intercept]')) return

      e.preventDefault()
      e.stopPropagation()

      const resolved = container.contains(el) ? el : container

      if (e.shiftKey) {
        // Shift+click: toggle this element in the multi-select set
        onMultiSelect(buildTarget(resolved, container, variantIndexRef.current))
      } else {
        // Regular click: if this is the only selection, deselect; otherwise replace
        if (isSelected(resolved) && targetsRef.current.length === 1) {
          onClear()
        } else {
          onSelect(buildTarget(resolved, container, variantIndexRef.current))
        }
      }
    }

    container.addEventListener('click', onClick, true) // capture phase
    return () => container.removeEventListener('click', onClick, true)
  }, [containerRef, onSelect, onMultiSelect, onClear])

  // ── Effect 3: amber outline on ALL selected elements ─────────────────────
  // Each cleanup removes outlines for the previous selection set before the
  // new set's outlines are applied — so switching selections is glitch-free.
  useEffect(() => {
    if (selectionTargets.length === 0) return
    for (const t of selectionTargets) {
      t.elementRef.style.outline = '2px solid #f59e0b'
      t.elementRef.style.outlineOffset = '-2px'
    }
    return () => {
      for (const t of selectionTargets) {
        t.elementRef.style.outline = ''
        t.elementRef.style.outlineOffset = ''
      }
    }
  }, [selectionTargets])

  return null
}
