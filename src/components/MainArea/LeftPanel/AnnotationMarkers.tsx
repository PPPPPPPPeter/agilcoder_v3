import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import type { Annotation } from '@/types'
import { useChat } from '@/context/ChatContext'

// ─── Color maps ───────────────────────────────────────────────────────────────

const STRENGTH: Record<Annotation['type'], number> = { dislike: 3, comment: 2, like: 1 }

const BADGE_BG: Record<Annotation['type'], string> = {
  like:    'rgba(34,197,94,0.15)',
  comment: 'rgba(59,130,246,0.15)',
  dislike: 'rgba(239,68,68,0.15)',
}

const BADGE_COLOR: Record<Annotation['type'], string> = {
  like:    '#22c55e',
  comment: '#3b82f6',
  dislike: '#ef4444',
}

// Inset box-shadow colors — won't conflict with outline used by selection system
const SHADOW_COLOR: Record<Annotation['type'], string> = {
  like:    'rgba(34,197,94,0.55)',
  comment: 'rgba(59,130,246,0.55)',
  dislike: 'rgba(239,68,68,0.55)',
}

// ─── Badge icon ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: Annotation['type'] }) {
  const Icon =
    type === 'like' ? ThumbsUp : type === 'dislike' ? ThumbsDown : MessageSquare
  return (
    <div
      className="w-4 h-4 rounded-sm flex items-center justify-center"
      style={{ backgroundColor: BADGE_BG[type] }}
    >
      <Icon size={9} color={BADGE_COLOR[type]} />
    </div>
  )
}

// ─── Marker data shape ────────────────────────────────────────────────────────

interface MarkerData {
  /** Stable key for React reconciliation */
  key: string
  /** Deduplicated annotation types on this element */
  types: Annotation['type'][]
  /** Strongest type (dislike > comment > like) — drives box-shadow color */
  strongestType: Annotation['type']
  /** Position/size relative to the preview container */
  top: number
  left: number
  width: number
  height: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns annotations that have real DOM element refs inside `container`.
 * Filters out mock placeholder refs (document.body) and detached nodes.
 */
function realAnnotations(annotations: Annotation[], container: HTMLElement): Annotation[] {
  return annotations.filter(
    a => a.target.elementRef !== document.body && container.contains(a.target.elementRef),
  )
}

function strongestType(types: Annotation['type'][]): Annotation['type'] {
  return types.reduce<Annotation['type']>(
    (best, t) => (STRENGTH[t] > STRENGTH[best] ? t : best),
    types[0],
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AnnotationMarkersProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function AnnotationMarkers({ containerRef }: AnnotationMarkersProps) {
  const { pendingAnnotations } = useChat()
  const [markers, setMarkers] = useState<MarkerData[]>([])

  // ── Effect 1: apply inset box-shadows directly on annotated elements ────────
  // Uses box-shadow (not outline) to avoid conflicting with selection outlines.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const real = realAnnotations(pendingAnnotations, container)

    // Group by element
    const grouped = new Map<HTMLElement, Annotation[]>()
    for (const a of real) {
      const list = grouped.get(a.target.elementRef) ?? []
      grouped.set(a.target.elementRef, [...list, a])
    }

    const applied: HTMLElement[] = []
    for (const [el, anns] of grouped) {
      const types = anns.map(a => a.type)
      const color = SHADOW_COLOR[strongestType(types)]
      el.style.boxShadow = `inset 0 0 0 2px ${color}`
      applied.push(el)
    }

    return () => {
      for (const el of applied) {
        el.style.boxShadow = ''
      }
    }
  }, [pendingAnnotations, containerRef])

  // ── Effect 2: compute badge overlay positions ────────────────────────────────
  // Runs after paint so getBoundingClientRect() reflects the final layout.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const real = realAnnotations(pendingAnnotations, container)

    if (real.length === 0) {
      setMarkers([])
      return
    }

    const containerRect = container.getBoundingClientRect()

    // Group by element
    const grouped = new Map<HTMLElement, Annotation[]>()
    for (const a of real) {
      const list = grouped.get(a.target.elementRef) ?? []
      grouped.set(a.target.elementRef, [...list, a])
    }

    const newMarkers: MarkerData[] = []
    for (const [el, anns] of grouped) {
      const rect = el.getBoundingClientRect()
      const types = [...new Set(anns.map(a => a.type))] as Annotation['type'][]

      newMarkers.push({
        key: anns.map(a => a.id).sort().join('|'),
        types,
        strongestType: strongestType(types),
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    setMarkers(newMarkers)
  }, [pendingAnnotations, containerRef])

  if (markers.length === 0) return null

  return (
    <>
      {markers.map(marker => (
        <div
          key={marker.key}
          className="absolute pointer-events-none"
          style={{
            top: marker.top,
            left: marker.left,
            width: marker.width,
            height: marker.height,
            zIndex: 10,
          }}
        >
          {/* Badge cluster: top-right corner of the annotated element */}
          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
            {marker.types.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
