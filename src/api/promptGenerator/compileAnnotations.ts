import type { Annotation } from '@/types'
// @ts-ignore — JS module; no type declarations
import { extractProperties } from '../manifestRenderingEng/index.js'
import type { Manifest } from './types.js'

// ─── Internal helpers ─────────────────────────────────────────────────────────

type ConstraintVerb = 'KEEP' | 'CHANGE' | 'ADJUST'

function verbFor(type: Annotation['type']): ConstraintVerb {
  if (type === 'like')    return 'KEEP'
  if (type === 'dislike') return 'CHANGE'
  return 'ADJUST' // 'comment' and 'tweak'
}

/** The selector string to use for an annotation target. */
function selectorOf(ann: Annotation): string {
  return ann.target.cssSelector ?? ann.target.label
}

/**
 * Formats a property map as a compact inline object literal.
 *   { 'background': '#1e293b', 'color': '#f1f5f9' }
 * Returns "(no existing rule)" when the map is empty.
 */
function formatProps(props: Record<string, string>): string {
  const entries = Object.entries(props)
  if (entries.length === 0) return '(no existing rule)'
  const body = entries.map(([k, v]) => `'${k}': '${v}'`).join(', ')
  return `{ ${body} }`
}

/**
 * Look up the current CSS properties for a given selector in a manifest.
 * Returns a formatted string suitable for inline display.
 */
function currentProps(selector: string, manifest: Manifest | undefined): string {
  if (!manifest) return '(no manifest)'
  if (!manifest.css) return '(no CSS yet — style from scratch)'
  const props = extractProperties(manifest.css, selector) as Record<string, string>
  return formatProps(props)
}

// ─── Constraint line builders ─────────────────────────────────────────────────

/**
 * Builds the main constraint phrase:
 *   KEEP: .name — "comment"
 *   CHANGE: .bio — restyle differently
 *   ADJUST: .nav-bar — "too cluttered"
 */
function constraintPhrase(
  verb: ConstraintVerb,
  target: string,
  comment: string | undefined,
): string {
  if (comment) return `${verb}: ${target} — "${comment}"`
  if (verb === 'CHANGE') return `${verb}: ${target} — restyle differently`
  if (verb === 'ADJUST') return `${verb}: ${target} — (flagged for tweaking)`
  return `${verb}: ${target}`
}

/** Single-element constraint block (2–3 lines). */
function buildSingleConstraint(ann: Annotation, manifest: Manifest | undefined): string[] {
  const verb     = verbFor(ann.type)
  const selector = selectorOf(ann)
  const lines    = [constraintPhrase(verb, selector, ann.comment)]

  // Current properties for all element-level constraints (helps the LLM reason)
  if (ann.target.level !== 'page') {
    lines.push(`  Current: ${currentProps(selector, manifest)}`)
  }
  return lines
}

/** Page-level constraint block (1 line — no "Current" since full CSS is shown separately). */
function buildPageConstraint(ann: Annotation, variantIndex: number): string[] {
  const verb   = verbFor(ann.type)
  // With a comment the target is just "overall"; without it we name the variant so the LLM
  // can track which one to keep/discard across multi-variant reasoning.
  const target = ann.comment ? 'overall' : `overall Variant ${variantIndex}`
  return [constraintPhrase(verb, target, ann.comment)]
}

/**
 * Group constraint block — emitted when 2+ annotations share the same
 * (type, comment) within a variant (i.e. they came from a multi-select batch).
 *
 * KEEP (group): .publication-card, .publication-tag — "love this styling"
 *   .publication-card → { padding: '0.75rem', … }
 *   .publication-tag  → { font-size: '0.625rem', … }
 *   Note: Preserve these elements as a group.
 */
function buildGroupConstraint(group: Annotation[], manifest: Manifest | undefined): string[] {
  const first     = group[0]
  const verb      = verbFor(first.type)
  const selectors = group.map(selectorOf).join(', ')
  const header    = `${verb} (group): ${selectors}${first.comment ? ` — "${first.comment}"` : ''}`
  const lines     = [header]

  // Per-element property lines
  for (const ann of group) {
    const sel = selectorOf(ann)
    lines.push(`  ${sel} → ${currentProps(sel, manifest)}`)
  }

  if (verb === 'KEEP') {
    lines.push('  Note: Preserve these elements as a group.')
  }
  return lines
}

// ─── Public function ──────────────────────────────────────────────────────────

/**
 * Compiles an array of Annotations into a human-readable constraint text block
 * ready to be embedded in a prompt.
 *
 * **Algorithm:**
 * 1. Group annotations by variantIndex (sorted ascending).
 * 2. Within each variant:
 *    a. Separate page-level from element-level.
 *    b. Detect multi-select groups: element-level annotations that share the
 *       same (type, comment) tuple are treated as one group constraint.
 *    c. Emit in order: page → groups → singles.
 * 3. For every element-level constraint, include current CSS properties from
 *    the corresponding manifest (via extractProperties).
 *
 * Returns an empty string when the annotation list is empty.
 */
export function compileAnnotations(
  annotations: Annotation[],
  manifests: Manifest[],
): string {
  if (annotations.length === 0) return ''

  // ── 1. Group by variantIndex ──────────────────────────────────────────────
  const byVariant = new Map<number, Annotation[]>()
  for (const ann of annotations) {
    const bucket = byVariant.get(ann.variantIndex) ?? []
    bucket.push(ann)
    byVariant.set(ann.variantIndex, bucket)
  }

  const variantBlocks: string[] = []

  // ── 2. Process each variant in ascending order ────────────────────────────
  for (const [variantIndex, anns] of [...byVariant.entries()].sort(([a], [b]) => a - b)) {
    const manifest   = manifests[variantIndex]
    const blockLines = [`[Variant ${variantIndex}]`]

    const pageAnns    = anns.filter(a => a.target.level === 'page')
    const elementAnns = anns.filter(a => a.target.level !== 'page')

    // ── 2b. Detect multi-select groups ──────────────────────────────────────
    // Annotations that share (type, comment) were likely added in one multi-
    // select batch.  Groups of 2+ become a single "group" constraint.
    const buckets = new Map<string, Annotation[]>()
    for (const ann of elementAnns) {
      const key    = `${ann.type}||${ann.comment ?? ''}`
      const bucket = buckets.get(key) ?? []
      bucket.push(ann)
      buckets.set(key, bucket)
    }

    const groups:  Annotation[][] = []
    const singles: Annotation[]   = []
    for (const bucket of buckets.values()) {
      if (bucket.length > 1) groups.push(bucket)
      else                   singles.push(bucket[0])
    }

    // ── 2c. Emit: page → groups → singles ────────────────────────────────
    for (const ann   of pageAnns) blockLines.push(...buildPageConstraint(ann, variantIndex))
    for (const group of groups)   blockLines.push(...buildGroupConstraint(group, manifest))
    for (const ann   of singles)  blockLines.push(...buildSingleConstraint(ann, manifest))

    variantBlocks.push(blockLines.join('\n'))
  }

  return variantBlocks.join('\n\n')
}
