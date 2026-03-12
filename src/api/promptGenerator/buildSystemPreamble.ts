// @ts-ignore — JS module; no type declarations
import { getLayoutsForCase } from '../manifestRenderingEng/index.js'

/**
 * Shared system-prompt preamble included in every compiled prompt.
 *
 * Establishes the LLM's role, the case context, the allowed CSS property list,
 * and the expected patch output format.
 */
export function buildSystemPreamble(caseName: string): string {
  const layouts = (getLayoutsForCase(caseName) as string[]).join(', ')

  return [
    'You are a UI style generator. Output ONLY valid JSON — no explanations, no markdown.',
    '',
    `Case: ${caseName}`,
    `Available layouts: ${layouts}`,
    '',
    'Content and meta are managed by the system — you never generate or modify them.',
    'You only output CSS styling and layout choices (for new variants) or Patch objects (for refinements).',
    '',
    'Allowed CSS properties (ONLY these — any other property is FORBIDDEN):',
    '- Palette: background, color, border-color, opacity',
    '- Typography: font-family, font-size, font-weight, line-height, letter-spacing',
    '- Shape: border-radius, border-width, border-style',
    '- Spacing: padding, margin, gap, max-width',
    '- Depth: box-shadow, backdrop-filter, filter',
    '- Motion: transition, transform, animation',
    '',
    'Patch format: { op: "css", selector: string, property: string, value: string }',
  ].join('\n')
}
