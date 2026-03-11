import { ChevronRight } from 'lucide-react'
import type { SelectionTarget } from '@/types'

// ─── Tailwind prefix detector (mirrors FeedbackOverlay) ──────────────────────
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

function getContentPath(el: HTMLElement): string | null {
  let cur: HTMLElement | null = el
  while (cur) {
    if (cur.dataset.contentPath) return cur.dataset.contentPath
    cur = cur.parentElement
  }
  return null
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

const SEMANTIC_TAGS = new Set(['section', 'main', 'nav', 'header', 'footer', 'article', 'aside'])

/** Walk from el up to container, return meaningful ancestor chain top-down. */
function getAncestors(el: HTMLElement, container: HTMLElement): Array<{ label: string; el: HTMLElement }> {
  const chain: HTMLElement[] = []
  let cur: HTMLElement | null = el
  while (cur) {
    chain.unshift(cur)
    if (cur === container) break
    cur = cur.parentElement
  }
  return chain
    .filter(node => {
      // Always keep both ends
      if (node === container || node === el) return true
      // Keep meaningful intermediate nodes
      const hasSemantic = [...node.classList].some(c => !isTwClass(c))
      return hasSemantic || SEMANTIC_TAGS.has(node.tagName.toLowerCase()) || !!node.dataset.contentPath
    })
    .map(node => ({
      el: node,
      label: node === container ? 'Page' : getLabel(node),
    }))
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SelectionBreadcrumbProps {
  selectionTarget: SelectionTarget
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: (target: SelectionTarget) => void
  onClear: () => void
}

export function SelectionBreadcrumb({ selectionTarget, containerRef, onSelect, onClear }: SelectionBreadcrumbProps) {
  const container = containerRef.current
  if (!container) return null

  const ancestors = getAncestors(selectionTarget.elementRef, container)

  const handleSegmentClick = (el: HTMLElement) => {
    // Clicking the root "Page" segment clears the selection
    if (el === container) {
      onClear()
      return
    }
    onSelect({
      scopeId: container.id || 'preview-container',
      variantIndex: 0,
      contentPath: getContentPath(el),
      cssSelector: null,
      level: getLevel(el, container),
      label: getLabel(el),
      elementRef: el,
    })
  }

  return (
    <div
      className="absolute top-0 left-0 right-0 z-40 flex items-center gap-0.5 px-2 overflow-x-auto"
      style={{
        height: 26,
        background: 'rgba(15,17,23,0.88)',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        scrollbarWidth: 'none',
      }}
    >
      {ancestors.map((segment, i) => {
        const isLast = i === ancestors.length - 1
        return (
          <span key={i} className="flex items-center gap-0.5 flex-shrink-0">
            {i > 0 && (
              <ChevronRight size={9} className="text-white/30 flex-shrink-0" />
            )}
            <button
              onClick={() => handleSegmentClick(segment.el)}
              className={`px-1 py-0.5 rounded font-mono transition-colors whitespace-nowrap ${
                isLast
                  ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              }`}
              style={{ fontSize: 10, lineHeight: '16px' }}
              title={`Select ${segment.label}`}
            >
              {segment.label}
            </button>
          </span>
        )
      })}
    </div>
  )
}
