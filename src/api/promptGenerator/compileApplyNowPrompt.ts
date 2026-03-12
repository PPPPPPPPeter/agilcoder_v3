import type { Annotation } from '@/types'
import type { Manifest, CompiledPrompt } from './types.js'
import { buildSystemPreamble } from './buildSystemPreamble.js'
import { compileAnnotations } from './compileAnnotations.js'

// ─── Public input type ────────────────────────────────────────────────────────

export interface ApplyNowInput {
  /** The manifest for the variant being edited in-place. */
  manifest: Manifest
  /**
   * One or more annotations to apply.
   * All must belong to the same variant (single element, multi-select, or page-level).
   */
  annotations: Annotation[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format the manifest CSS for embedding in a prompt.
 * Uses triple-quote delimiters; falls back to descriptive string when empty.
 */
function cssBlock(css: string): string {
  return css.trim()
    ? `"""\n${css}\n"""`
    : '(no CSS yet — style from scratch)'
}

// ─── Public function ──────────────────────────────────────────────────────────

/**
 * Compiles an Apply Now prompt for in-place editing of a single variant.
 *
 * **Scenario coverage (from spec):**
 *
 * | # | Input shape                          | Constraint emitted                               |
 * |---|--------------------------------------|--------------------------------------------------|
 * | 1 | Single element, like/dislike+comment  | `KEEP/CHANGE: .name — "comment"` + current props |
 * | 2 | Single element, comment only          | `ADJUST: .name — "comment"` + current props      |
 * | 3 | Multi-select, like/dislike+comment    | `KEEP/CHANGE (group): …` + per-element props     |
 * | 4 | Multi-select, comment only            | `ADJUST (group): …` + per-element props          |
 * | 5 | Entire page, like/dislike+comment     | `KEEP/CHANGE: overall — "comment"`               |
 * | 6 | Entire page, comment only             | `ADJUST: overall — "comment"`                    |
 *
 * **Output format:** `{ "patches": [...] }` — patches only.
 * `summary` and `approach` fields are intentionally absent: Apply Now is a silent
 * in-place edit that does not create a new named variant to display to the user.
 *
 * @throws When `annotations` is empty.
 */
export function compileApplyNowPrompt({ manifest, annotations }: ApplyNowInput): CompiledPrompt {
  if (annotations.length === 0) {
    throw new Error('compileApplyNowPrompt: annotations array must not be empty')
  }

  const caseName = manifest.meta.case

  // ── Scope detection ─────────────────────────────────────────────────────────
  // Apply Now can target either the entire page or specific element(s).
  const isPageLevel = annotations.some(a => a.target.level === 'page')

  // ── System prompt ────────────────────────────────────────────────────────────
  // Apply Now is a silent in-place edit — patches only, no summary or approach fields.
  const patchesFormat = 'Respond with JSON: { "patches": [ { "op": "css", "selector": "...", "property": "...", "value": "..." }, ... ] }'

  const scopeInstruction = isPageLevel
    ? [
        'Apply changes globally across the entire page.',
        'Maintain visual coherence and consistency.',
        patchesFormat,
      ].join('\n')
    : [
        'Modify ONLY the targeted element(s). Do not change any other element.',
        'The result must remain visually coherent with the rest of the page.',
        patchesFormat,
      ].join('\n')

  const system = [buildSystemPreamble(caseName), '', scopeInstruction].join('\n')

  // ── Constraint text ──────────────────────────────────────────────────────────
  // Normalize all annotations to variantIndex 0 so compileAnnotations can look
  // up `manifests[0]` for current CSS properties.
  const normalizedAnnotations: Annotation[] = annotations.map(a => ({
    ...a,
    variantIndex: 0,
    target: { ...a.target, variantIndex: 0 },
  }))

  const constraintText = compileAnnotations(normalizedAnnotations, [manifest])

  // ── User prompt ──────────────────────────────────────────────────────────────
  const user = [
    `Current page CSS:\n${cssBlock(manifest.css)}`,
    `Layout: ${manifest.layout}`,
    '',
    constraintText,
    '',
    // Reminder matches the system prompt: patches only, no summary/approach.
    'Respond with JSON: { "patches": [...] }',
  ].join('\n')

  return { system, user }
}
