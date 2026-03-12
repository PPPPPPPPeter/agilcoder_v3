import type { ChatMessage, Annotation } from '@/types'
import type { Manifest, CompiledPrompt } from './types.js'
import { buildSystemPreamble } from './buildSystemPreamble.js'
import { compileAnnotations } from './compileAnnotations.js'

// ─── Public input type ────────────────────────────────────────────────────────

export interface ChatSendInput {
  /** Case name (e.g. "academic-homepage") — required for the system preamble. */
  caseName: string
  /** All current variant manifests. Empty array signals a first-round / fresh generation. */
  manifests: Manifest[]
  /** Pending annotations across all variants. May be empty. */
  annotations: Annotation[]
  /** The user's typed instruction from the Chat input. May be empty if annotations suffice. */
  userInstruction: string
  /** Previous Chat messages — used to build the conversation-history summary. */
  conversationHistory: ChatMessage[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Builds a compact round-by-round history summary, e.g.:
 *
 *   Round 1: "Clean Swiss style" → 3 variants
 *   Round 2: "More contrast" → 3 variants (current)
 *
 * @param markLastAsCurrent - Append "(current)" to the last round entry.
 */
function buildHistorySummary(
  conversationHistory: ChatMessage[],
  markLastAsCurrent = false,
): string {
  const lines: string[] = []
  let roundNum = 1

  for (let i = 0; i < conversationHistory.length; i++) {
    const msg = conversationHistory[i]
    if (msg.role !== 'user') continue

    // Find the assistant reply that directly follows this user message
    let variantCount = 3
    for (let j = i + 1; j < conversationHistory.length; j++) {
      if (conversationHistory[j].role === 'assistant') {
        variantCount = conversationHistory[j].variantCount ?? 3
        break
      }
    }

    // Detect whether this is the last user message in the history
    let isLastUserMsg = true
    for (let j = i + 1; j < conversationHistory.length; j++) {
      if (conversationHistory[j].role === 'user') {
        isLastUserMsg = false
        break
      }
    }

    const currentLabel = markLastAsCurrent && isLastUserMsg ? ' (current)' : ''
    lines.push(`  Round ${roundNum}: "${msg.text}" → ${variantCount} variants${currentLabel}`)
    roundNum++
  }

  return lines.join('\n')
}

/**
 * Format a manifest's CSS for prompt embedding.
 * Uses triple-quote delimiters; falls back to descriptive string when empty.
 */
function cssBlock(css: string): string {
  return css.trim()
    ? `"""\n${css}\n"""`
    : '(no CSS yet — style from scratch)'
}

// ─── Scenario 11: Fresh generation ───────────────────────────────────────────

/**
 * Builds a fresh-generation prompt (Scenario 11).
 * No feedback context — asks the LLM for 3 distinct `{ layout, css }` variants.
 */
function buildFreshGenerationPrompt(
  caseName: string,
  userInstruction: string,
  conversationHistory: ChatMessage[],
): CompiledPrompt {
  const freshInstruction = [
    'Generate 3 distinct style interpretations of the user\'s description.',
    'For each, choose a layout and write a complete CSS string.',
    'Each variant should look noticeably different from the others.',
    'For each variant also include:',
    '  "summary": one sentence describing this variant\'s visual character — displayed to the user near its thumbnail.',
    '  "approach": a short label such as "conservative", "balanced", or "exploratory" — helps users distinguish variants at a glance.',
    'Respond with JSON: { "variants": [ { "layout": "...", "css": "...", "summary": "...", "approach": "..." }, ... ] }',
  ].join('\n')

  const system = [buildSystemPreamble(caseName), '', freshInstruction].join('\n')

  const hasHistory = conversationHistory.length > 0

  let user: string
  if (hasHistory) {
    const historySummary = buildHistorySummary(conversationHistory, false)
    user = [
      'Previous rounds context:',
      historySummary,
      '',
      `New style description (fresh start): "${userInstruction}"`,
    ].join('\n')
  } else {
    user = `Style description: "${userInstruction}"`
  }

  return { system, user }
}

// ─── Scenarios 7–10: Refinement with feedback ────────────────────────────────

/**
 * Builds a refinement prompt (Scenarios 7–10).
 * Includes current variant CSS, compiled feedback constraints, and an optional
 * additional instruction. Asks the LLM for 3 patch sets against existing variants.
 */
function buildRefinementPrompt(
  caseName: string,
  manifests: Manifest[],
  annotations: Annotation[],
  userInstruction: string,
  conversationHistory: ChatMessage[],
): CompiledPrompt {
  // ── System ─────────────────────────────────────────────────────────────────
  const refinementInstruction = [
    'Generate 3 refined style variants based on user feedback and instructions.',
    'For each variant, choose an existing variant as base and return a patch set.',
    'Respect all KEEP/CHANGE/ADJUST constraints.',
    'Text instructions define the global direction. Element annotations are local constraints.',
    'If they conflict, include a "conflicts" array explaining the tension.',
    'For each variant also include:',
    '  "summary": one sentence describing this variant\'s visual character — displayed to the user near its thumbnail.',
    '  "approach": a short label such as "conservative", "balanced", or "exploratory" — helps users distinguish variants at a glance.',
    'Respond with JSON:',
    '{',
    '  "variants": [',
    '    { "baseVariantIndex": 0, "patches": [...], "summary": "...", "approach": "..." },',
    '    ...',
    '  ],',
    '  "conflicts": []',
    '}',
  ].join('\n')

  const system = [buildSystemPreamble(caseName), '', refinementInstruction].join('\n')

  // ── User ───────────────────────────────────────────────────────────────────

  const userParts: string[] = []

  // 1. Conversation history (if any)
  if (conversationHistory.length > 0) {
    const historySummary = buildHistorySummary(conversationHistory, true)
    userParts.push(['=== Conversation History ===', historySummary].join('\n'))
  }

  // 2. Current variant CSS blocks
  const variantLines: string[] = ['=== Current Variants ===']
  for (let i = 0; i < manifests.length; i++) {
    const m = manifests[i]
    variantLines.push('')
    variantLines.push(`Variant ${i} (layout: ${m.layout}):`)
    variantLines.push(cssBlock(m.css))
  }
  userParts.push(variantLines.join('\n'))

  // 3. Feedback constraints
  const constraintText = compileAnnotations(annotations, manifests)
  userParts.push(['=== Feedback Constraints ===', constraintText].join('\n'))

  // 4. Additional instruction (omit section when instruction is empty)
  const trimmedInstruction = userInstruction.trim()
  if (trimmedInstruction) {
    userParts.push(`=== Additional Instruction ===\n"${trimmedInstruction}"`)
  }

  // 5. Response reminder
  userParts.push('Respond with JSON: { "variants": [...], "conflicts": [] }')

  const user = userParts.join('\n\n')

  return { system, user }
}

// ─── Public function ──────────────────────────────────────────────────────────

/**
 * Compiles a Chat Send prompt for generating new variants from accumulated
 * cross-variant feedback and/or a user text instruction.
 *
 * **Scenario detection:**
 *
 * | Condition                               | Path           |
 * |-----------------------------------------|----------------|
 * | `manifests` empty (first round)         | Scenario 11 — fresh generation |
 * | No annotations, has `userInstruction`   | Scenario 11 — fresh generation |
 * | Has annotations (with or without text)  | Scenarios 7–10 — refinement    |
 *
 * **Scenario coverage:**
 *
 * | # | Annotations shape           | Constraints emitted                            |
 * |---|-----------------------------|-------------------------------------------------|
 * | 7 | Cross-variant, single elems | Per-variant element constraints + current props |
 * | 8 | Cross-variant, multi-select | Group constraints + coherence notes             |
 * | 9 | Cross-variant, page-level   | `KEEP/CHANGE: overall Variant {N}` per variant  |
 * |10 | Cross-variant, mixed levels | Grouped by variant: page → groups → elements   |
 * |11 | No annotations              | No constraints; ask for fresh `{ layout, css }` |
 *
 * @throws When both `annotations` and `userInstruction` are empty.
 */
export function compileChatSendPrompt({
  caseName,
  manifests,
  annotations,
  userInstruction,
  conversationHistory,
}: ChatSendInput): CompiledPrompt {
  const hasAnnotations    = annotations.length > 0
  const hasInstruction    = userInstruction.trim().length > 0
  const isFirstRound      = manifests.length === 0

  if (!hasAnnotations && !hasInstruction) {
    throw new Error(
      'compileChatSendPrompt: both annotations and userInstruction are empty — nothing to compile',
    )
  }

  // Scenario 11: fresh generation
  if (isFirstRound || (!hasAnnotations && hasInstruction)) {
    return buildFreshGenerationPrompt(caseName, userInstruction, conversationHistory)
  }

  // Scenarios 7–10: refinement with feedback
  return buildRefinementPrompt(caseName, manifests, annotations, userInstruction, conversationHistory)
}
