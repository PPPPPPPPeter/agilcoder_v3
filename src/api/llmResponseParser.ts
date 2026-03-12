/**
 * LLMResponseParser — JSON parsing + manifest assembly / patching.
 *
 * Takes the raw string returned by LLMService, validates and parses the JSON,
 * and transforms it into ready-to-render manifests using @manifest/engine.
 *
 * Three public entry points (one per LLM call path):
 *   parseGenerateVariantsResponse  — Scenario 11:  fresh { layout, css } generation
 *   parseRefineVariantsResponse    — Scenarios 7–10: patch-based refinement
 *   parseApplyNowResponse          — Scenarios 1–6:  Apply Now in-place element edit
 *
 * All functions return a result object (never throw) so callers can display
 * partial results and accumulated error messages directly in the Chat tab.
 *
 * Pure TypeScript — no React, no hooks, no side effects.
 */

// @ts-ignore — JS module; no type declarations
import {
  createManifest,
  getPreset,
  validateManifest,
  applyBatch,
  validatePatch,
  getLayoutsForCase,
} from './manifestRenderingEng/index.js'

import type { Manifest } from './promptGenerator/types.js'

// ─── Minimal Patch type (mirrors engine's Patch interface) ───────────────────

interface Patch {
  op:         string
  path?:      string
  value?:     unknown
  from?:      string
  selector?:  string
  property?:  string
  action?:    string
  rule?:      string
  source?:    string
  timestamp?: number
}

// ─── Public result types ──────────────────────────────────────────────────────

export interface ParsedGenerateResult {
  /** true if at least one variant was assembled successfully. */
  success:   boolean
  /** Assembled manifests ready to render — may be fewer than 3 on partial failure. */
  manifests: Manifest[]
  /** LLM-generated display metadata, one entry per successful manifest (same order). */
  metadata:  Array<{ summary: string; approach: string }>
  /** Validation / parse errors. Non-empty does not mean total failure. */
  errors:    string[]
}

export interface ParsedRefineResult {
  /** true if at least one variant was patched successfully. */
  success:   boolean
  /** Patched manifests ready to render. */
  manifests: Manifest[]
  /** LLM-generated display metadata, one entry per successful manifest. */
  metadata:  Array<{ baseVariantIndex: number; summary: string; approach: string }>
  /** Conflict descriptions reported by the LLM. */
  conflicts: string[]
  errors:    string[]
}

export interface ParsedApplyNowResult {
  /** true if at least one patch was applied. false if all patches failed. */
  success:      boolean
  /** Patched manifest, or the original manifest unchanged if all patches failed. */
  manifest:     Manifest
  /** Number of patches successfully applied. */
  appliedCount: number
  /** Number of patches skipped due to validation failure. */
  skippedCount: number
  errors:       string[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Attempts to parse raw LLM output as JSON via three progressively lenient strategies:
 *
 * 1. Direct `JSON.parse` on the trimmed string.
 * 2. Strip ```json … ``` or ``` … ``` markdown fences, then parse.
 * 3. Extract the first balanced `{ }` or `[ ]` block, then parse.
 */
function safeParseJSON(raw: string): { data: unknown; error: string | null } {
  // Strategy 1 — direct parse
  try {
    return { data: JSON.parse(raw.trim()), error: null }
  } catch { /* fall through */ }

  // Strategy 2 — strip markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch?.[1]) {
    try {
      return { data: JSON.parse(fenceMatch[1].trim()), error: null }
    } catch { /* fall through */ }
  }

  // Strategy 3 — extract first balanced { } or [ ] block
  const extracted = extractFirstBalancedBlock(raw)
  if (extracted !== null) {
    try {
      return { data: JSON.parse(extracted), error: null }
    } catch { /* fall through */ }
  }

  return { data: null, error: 'Failed to parse LLM response as JSON.' }
}

/**
 * Finds the first balanced `{ }` or `[ ]` block in `raw`.
 * Correctly handles nested structures and string literals.
 * Returns null if no complete balanced block is found.
 */
function extractFirstBalancedBlock(raw: string): string | null {
  const braceIdx   = raw.indexOf('{')
  const bracketIdx = raw.indexOf('[')

  if (braceIdx === -1 && bracketIdx === -1) return null

  let start: number
  let openChar:  string
  let closeChar: string

  if (braceIdx === -1) {
    start = bracketIdx; openChar = '['; closeChar = ']'
  } else if (bracketIdx === -1) {
    start = braceIdx;   openChar = '{'; closeChar = '}'
  } else {
    start = Math.min(braceIdx, bracketIdx)
    openChar  = raw[start] === '{' ? '{' : '['
    closeChar = openChar === '{' ? '}' : ']'
  }

  let depth      = 0
  let inString   = false
  let escapeNext = false

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]

    if (escapeNext)             { escapeNext = false; continue }
    if (ch === '\\' && inString){ escapeNext = true;  continue }
    if (ch === '"')             { inString = !inString; continue }
    if (inString)               { continue }

    if (ch === openChar)  depth++
    if (ch === closeChar) {
      depth--
      if (depth === 0) return raw.slice(start, i + 1)
    }
  }

  return null
}

/** Safely coerce a potentially undefined string to a non-empty string or fallback. */
function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback
}

// ─── Function 1: parseGenerateVariantsResponse ───────────────────────────────

/**
 * Parse a fresh-generation LLM response into assembled Manifest objects.
 *
 * Expected input shape:
 * ```json
 * { "variants": [ { "layout": "...", "css": "...", "summary": "...", "approach": "..." }, ... ] }
 * ```
 *
 * Called by: Chat Send handler after `callLLM()` for Scenario 11 (no annotations / first round).
 *
 * Error recovery:
 * - Invalid layout → falls back to first layout for the case.
 * - Missing / non-string CSS → treated as empty string.
 * - Missing summary / approach → replaced with sensible fallback strings.
 * - Engine errors on individual variants are caught and logged; remaining variants proceed.
 * - Partial success (some variants OK, some failed) → success: true with errors populated.
 */
export function parseGenerateVariantsResponse(
  raw:           string,
  caseName:      string,
  contentPreset: string,
): ParsedGenerateResult {
  const errors: string[] = []

  // ── 1. Parse JSON ──────────────────────────────────────────────────────────
  const { data, error: parseError } = safeParseJSON(raw)
  if (parseError || data === null) {
    return {
      success:   false,
      manifests: [],
      metadata:  [],
      errors:    [parseError ?? 'LLM response was empty.'],
    }
  }

  // ── 2. Validate top-level structure ───────────────────────────────────────
  const parsed = data as Record<string, unknown>
  if (!Array.isArray(parsed.variants)) {
    return {
      success:   false,
      manifests: [],
      metadata:  [],
      errors:    ['LLM response is missing the required "variants" array.'],
    }
  }

  const availableLayouts: string[] = getLayoutsForCase(caseName) as string[]
  const fallbackLayout = availableLayouts[0] ?? 'classic'

  // ── 3. Process each variant ────────────────────────────────────────────────
  const manifests: Manifest[] = []
  const metadata:  Array<{ summary: string; approach: string }> = []

  for (let i = 0; i < (parsed.variants as unknown[]).length; i++) {
    const v = (parsed.variants as Record<string, unknown>[])[i]

    try {
      // a. Validate / coerce layout
      const rawLayout = typeof v.layout === 'string' ? v.layout : ''
      const layout = availableLayouts.includes(rawLayout)
        ? rawLayout
        : (() => {
            if (rawLayout) {
              errors.push(`Variant ${i}: unknown layout "${rawLayout}" — using "${fallbackLayout}".`)
            }
            return fallbackLayout
          })()

      // b. Validate / coerce CSS (warnings only — forbidden properties are non-fatal)
      const css = typeof v.css === 'string' ? v.css : ''

      // c. Assemble manifest
      const content = getPreset(caseName, contentPreset) as Record<string, unknown>
      const manifest = createManifest({
        caseName,
        preset:      contentPreset,
        content,
        layout,
        css,
        description: `Generated variant ${i}`,
      }) as Manifest

      // d. Validate assembled manifest
      const { valid, errors: validationErrors } = validateManifest(manifest) as {
        valid: boolean
        errors: string[]
      }
      if (!valid) {
        errors.push(`Variant ${i} failed validation: ${validationErrors.join('; ')}`)
        continue  // skip this variant
      }

      manifests.push(manifest)
      metadata.push({
        summary:  stringOr(v.summary,  `Variant ${i + 1}`),
        approach: stringOr(v.approach, 'balanced'),
      })
    } catch (err) {
      errors.push(
        `Variant ${i} could not be assembled: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return {
    success:   manifests.length > 0,
    manifests,
    metadata,
    errors,
  }
}

// ─── Function 2: parseRefineVariantsResponse ─────────────────────────────────

/**
 * Parse a refinement LLM response, apply patches to base manifests, and return
 * the resulting patched manifests.
 *
 * Expected input shape:
 * ```json
 * {
 *   "variants": [
 *     { "baseVariantIndex": 0, "patches": [...], "summary": "...", "approach": "..." },
 *     ...
 *   ],
 *   "conflicts": []
 * }
 * ```
 *
 * Called by: Chat Send handler after `callLLM()` for Scenarios 7–10 (has annotations).
 *
 * Error recovery:
 * - Out-of-range baseVariantIndex → defaults to 0.
 * - Invalid individual patches → skipped, logged in errors, remaining patches applied.
 * - Engine `applyBatch` failure → original base manifest returned for that variant, error logged.
 * - Partial success across variants → all successful variants returned.
 */
export function parseRefineVariantsResponse(
  raw:              string,
  currentManifests: Manifest[],
): ParsedRefineResult {
  const errors: string[] = []

  // ── 1. Parse JSON ──────────────────────────────────────────────────────────
  const { data, error: parseError } = safeParseJSON(raw)
  if (parseError || data === null) {
    return {
      success:   false,
      manifests: [],
      metadata:  [],
      conflicts: [],
      errors:    [parseError ?? 'LLM response was empty.'],
    }
  }

  // ── 2. Validate top-level structure ───────────────────────────────────────
  const parsed = data as Record<string, unknown>
  if (!Array.isArray(parsed.variants)) {
    return {
      success:   false,
      manifests: [],
      metadata:  [],
      conflicts: [],
      errors:    ['LLM response is missing the required "variants" array.'],
    }
  }

  // Extract conflict strings reported by the LLM
  const conflicts: string[] = Array.isArray(parsed.conflicts)
    ? (parsed.conflicts as unknown[])
        .map(c => (typeof c === 'string' ? c : JSON.stringify(c)))
    : []

  // ── 3. Process each variant ────────────────────────────────────────────────
  const manifests: Manifest[] = []
  const metadata: Array<{ baseVariantIndex: number; summary: string; approach: string }> = []

  for (let i = 0; i < (parsed.variants as unknown[]).length; i++) {
    const v = (parsed.variants as Record<string, unknown>[])[i]

    // a. Validate / coerce baseVariantIndex
    const rawIdx = typeof v.baseVariantIndex === 'number' ? v.baseVariantIndex : 0
    const baseIdx = rawIdx >= 0 && rawIdx < currentManifests.length
      ? rawIdx
      : (() => {
          errors.push(
            `Variant ${i}: baseVariantIndex ${rawIdx} is out of range — using 0.`,
          )
          return 0
        })()

    const baseManifest = currentManifests[baseIdx]

    // b. Validate each patch — collect valid ones, log skipped ones
    const rawPatches: Patch[] = Array.isArray(v.patches)
      ? (v.patches as unknown[]).map(p => p as Patch)
      : []

    const validPatches: Patch[] = []
    for (const patch of rawPatches) {
      const { valid, errors: patchErrors } = validatePatch(baseManifest, patch) as {
        valid: boolean
        errors: string[]
      }
      if (valid) {
        validPatches.push(patch)
      } else {
        errors.push(
          `Variant ${i}: patch skipped — ${patchErrors.join('; ')}`,
        )
      }
    }

    // c. Apply valid patches
    let resultManifest: Manifest
    try {
      if (validPatches.length > 0) {
        const { result } = applyBatch(baseManifest, validPatches) as {
          result: Manifest
          inverses: Patch[]
        }
        resultManifest = result
      } else {
        // No valid patches — return the base manifest unchanged for this variant
        resultManifest = baseManifest
        if (rawPatches.length > 0) {
          errors.push(`Variant ${i}: all patches failed validation — base manifest returned.`)
        }
      }
    } catch (err) {
      errors.push(
        `Variant ${i}: patch application failed (${err instanceof Error ? err.message : String(err)}) — base manifest returned.`,
      )
      resultManifest = baseManifest
    }

    // d. Validate resulting manifest
    const { valid, errors: validationErrors } = validateManifest(resultManifest) as {
      valid: boolean
      errors: string[]
    }
    if (!valid) {
      errors.push(`Variant ${i} post-patch validation failed: ${validationErrors.join('; ')}`)
      // Still include it — the manifest may be usable despite minor schema warnings
    }

    manifests.push(resultManifest)
    metadata.push({
      baseVariantIndex: baseIdx,
      summary:          stringOr(v.summary,  `Refined variant ${i + 1}`),
      approach:         stringOr(v.approach, 'balanced'),
    })
  }

  return {
    success:   manifests.length > 0,
    manifests,
    metadata,
    conflicts,
    errors,
  }
}

// ─── Function 3: parseApplyNowResponse ───────────────────────────────────────

/**
 * Parse an Apply Now LLM response and apply the patches to the current manifest.
 *
 * Expected input shape:
 * ```json
 * { "patches": [ { "op": "css", "selector": "...", "property": "...", "value": "..." }, ... ] }
 * ```
 *
 * Called by: Action Popover "Apply Now" handler after `callLLM()` (Scenarios 1–6).
 *
 * Error recovery:
 * - Invalid patches → skipped; valid patches are still applied.
 * - All patches invalid or `applyBatch` throws → original manifest returned unchanged with success: false.
 */
export function parseApplyNowResponse(
  raw:      string,
  manifest: Manifest,
): ParsedApplyNowResult {
  const errors: string[] = []

  // ── 1. Parse JSON ──────────────────────────────────────────────────────────
  const { data, error: parseError } = safeParseJSON(raw)
  if (parseError || data === null) {
    return {
      success:      false,
      manifest,
      appliedCount: 0,
      skippedCount: 0,
      errors:       [parseError ?? 'LLM response was empty.'],
    }
  }

  // ── 2. Validate top-level structure ───────────────────────────────────────
  const parsed = data as Record<string, unknown>
  if (!Array.isArray(parsed.patches)) {
    return {
      success:      false,
      manifest,
      appliedCount: 0,
      skippedCount: 0,
      errors:       ['LLM response is missing the required "patches" array.'],
    }
  }

  const rawPatches = parsed.patches as unknown[]

  // ── 3. Validate each patch ────────────────────────────────────────────────
  const validPatches: Patch[] = []
  let skippedCount = 0

  for (let i = 0; i < rawPatches.length; i++) {
    const patch = rawPatches[i] as Patch
    const { valid, errors: patchErrors } = validatePatch(manifest, patch) as {
      valid: boolean
      errors: string[]
    }
    if (valid) {
      validPatches.push(patch)
    } else {
      skippedCount++
      errors.push(`Patch ${i} skipped: ${patchErrors.join('; ')}`)
    }
  }

  // ── 4. Apply valid patches ────────────────────────────────────────────────
  if (validPatches.length === 0) {
    if (rawPatches.length > 0) {
      errors.push('All patches failed validation — original manifest unchanged.')
    }
    return {
      success:      false,
      manifest,         // original unchanged
      appliedCount: 0,
      skippedCount,
      errors,
    }
  }

  let resultManifest: Manifest
  try {
    const { result } = applyBatch(manifest, validPatches) as {
      result: Manifest
      inverses: Patch[]
    }
    resultManifest = result
  } catch (err) {
    errors.push(
      `Patch application failed: ${err instanceof Error ? err.message : String(err)} — original manifest unchanged.`,
    )
    return {
      success:      false,
      manifest,         // original unchanged
      appliedCount: 0,
      skippedCount: skippedCount + validPatches.length,
      errors,
    }
  }

  // ── 5. Validate resulting manifest ───────────────────────────────────────
  const { valid, errors: validationErrors } = validateManifest(resultManifest) as {
    valid: boolean
    errors: string[]
  }
  if (!valid) {
    // Non-fatal: still return the patched result but surface the warning
    errors.push(`Post-patch validation warning: ${validationErrors.join('; ')}`)
  }

  return {
    success:      true,
    manifest:     resultManifest,
    appliedCount: validPatches.length,
    skippedCount,
    errors,
  }
}
