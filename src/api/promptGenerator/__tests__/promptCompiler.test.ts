/**
 * PromptCompiler — visual inspection test runner
 *
 * Runs standalone (no test framework needed):
 *   npx tsx src/api/promptGenerator/__tests__/promptCompiler.test.ts
 *
 * Covers all 11 scenarios from the spec:
 *   Scenarios 1–6  → compileApplyNowPrompt
 *   Scenarios 7–11 → compileChatSendPrompt
 */

import type { Annotation, SelectionTarget, ChatMessage } from '@/types'
import type { Manifest } from '../types.js'
import { compileApplyNowPrompt }  from '../compileApplyNowPrompt.js'
import { compileChatSendPrompt }  from '../compileChatSendPrompt.js'

// ─── Minimal inline test harness ─────────────────────────────────────────────
// Works standalone (tsx) with no external test runner.

const PASS = '✓'
const FAIL = '✗'

function describe(label: string, fn: () => void): void {
  console.log(`\n${'═'.repeat(72)}\n  ${label}\n${'═'.repeat(72)}`)
  fn()
}

function it(label: string, fn: () => void): void {
  console.log(`\n  ▸ ${label}`)
  try {
    fn()
    console.log(`    ${PASS} passed`)
  } catch (e) {
    console.error(`    ${FAIL} FAILED: ${e instanceof Error ? e.message : String(e)}`)
    if (e instanceof Error && e.stack) {
      const firstLine = e.stack.split('\n')[1] ?? ''
      console.error(`       ${firstLine.trim()}`)
    }
  }
}

function printPrompt(label: string, compiled: { system: string; user: string }): void {
  const DIVIDER = '─'.repeat(64)
  console.log(`\n    ┌─ SYSTEM ${DIVIDER.slice(10)}`)
  compiled.system.split('\n').forEach(l => console.log(`    │ ${l}`))
  console.log(`    ├─ USER ${DIVIDER.slice(9)}`)
  compiled.user.split('\n').forEach(l => console.log(`    │ ${l}`))
  console.log(`    └${DIVIDER}`)
}

// ─── Mock data factories ──────────────────────────────────────────────────────

const CASE_NAME = 'academic-homepage'

/** Shared CSS used across manifests. */
const SAMPLE_CSS = [
  `.name { font-size: 1.5rem; font-weight: 700; color: #1e293b; }`,
  `.bio { max-width: 42rem; line-height: 1.625; }`,
  `.nav-bar { background: #1e293b; color: #f1f5f9; }`,
  `.publication-card { padding: 0.75rem; border: 1px solid #e5e7eb; }`,
  `.publication-tag { font-size: 0.625rem; background: #f3f4f6; }`,
  `.hero { background: #f8fafc; padding: 3rem 2rem; }`,
].join('\n')

/** Build a minimal Manifest. */
function makeManifest(layout: string, css = SAMPLE_CSS): Manifest {
  return {
    meta: { case: CASE_NAME, contentPreset: 'default', description: 'Academic Homepage' },
    content: {},
    layout,
    css,
  }
}

/** Build an element-level SelectionTarget. */
function makeElementTarget(cssSelector: string, variantIndex = 0): SelectionTarget {
  return {
    scopeId:      `scope-${variantIndex}`,
    variantIndex,
    contentPath:  null,
    cssSelector,
    level:        'element',
    label:        cssSelector,
    elementRef:   {} as HTMLElement,
  }
}

/** Build a page-level SelectionTarget. */
function makePageTarget(variantIndex = 0): SelectionTarget {
  return {
    scopeId:      `scope-${variantIndex}`,
    variantIndex,
    contentPath:  null,
    cssSelector:  null,
    level:        'page',
    label:        'Entire UI',
    elementRef:   {} as HTMLElement,
  }
}

let _idCounter = 0
function makeAnnotation(
  overrides: Partial<Annotation> & { target: SelectionTarget },
): Annotation {
  return {
    id:           `ann-${++_idCounter}`,
    variantIndex: overrides.target.variantIndex,
    type:         'like',
    ...overrides,
  }
}

/** Build a ChatMessage. */
function makeUserMsg(text: string): ChatMessage {
  return { id: `msg-${++_idCounter}`, role: 'user', text, timestamp: Date.now() }
}
function makeAssistantMsg(text: string, variantCount = 3): ChatMessage {
  return { id: `msg-${++_idCounter}`, role: 'assistant', text, variantCount, timestamp: Date.now() }
}

// ─── Pre-built shared fixtures ────────────────────────────────────────────────

const manifest0 = makeManifest('sidebar-left')
const manifest1 = makeManifest('classic')
const manifest2 = makeManifest('hero-banner', '')  // empty CSS — first generation edge case

const conversationHistory: ChatMessage[] = [
  makeUserMsg('Clean Swiss style'),
  makeAssistantMsg('Generated 3 variants', 3),
  makeUserMsg('More contrast'),
  makeAssistantMsg('Refined 3 variants', 3),
]

// ─── Apply Now: Scenarios 1–6 ─────────────────────────────────────────────────

describe('Scenario 1 — Apply Now: single element, like + comment', () => {
  it('compiles KEEP constraint with current props', () => {
    const ann = makeAnnotation({
      target:  makeElementTarget('.name'),
      type:    'like',
      comment: 'Love the weight, just bump it to 800',
    })
    const result = compileApplyNowPrompt({ manifest: manifest0, annotations: [ann] })
    printPrompt('Scenario 1', result)
  })
})

describe('Scenario 2 — Apply Now: single element, comment only', () => {
  it('compiles ADJUST constraint with current props', () => {
    const ann = makeAnnotation({
      target:  makeElementTarget('.bio'),
      type:    'comment',
      comment: 'make longer line length',
    })
    const result = compileApplyNowPrompt({ manifest: manifest0, annotations: [ann] })
    printPrompt('Scenario 2', result)
  })
})

describe('Scenario 3 — Apply Now: multi-select, like + comment', () => {
  it('compiles KEEP (group) constraint with per-element props', () => {
    const sharedComment = 'love this styling'
    const ann1 = makeAnnotation({ target: makeElementTarget('.publication-card'), type: 'like', comment: sharedComment })
    const ann2 = makeAnnotation({ target: makeElementTarget('.publication-tag'),  type: 'like', comment: sharedComment })
    const result = compileApplyNowPrompt({ manifest: manifest0, annotations: [ann1, ann2] })
    printPrompt('Scenario 3', result)
  })
})

describe('Scenario 4 — Apply Now: multi-select, comment only', () => {
  it('compiles ADJUST (group) constraint', () => {
    const sharedComment = 'make these feel lighter'
    const ann1 = makeAnnotation({ target: makeElementTarget('.nav-bar'),  type: 'comment', comment: sharedComment })
    const ann2 = makeAnnotation({ target: makeElementTarget('.hero'),      type: 'comment', comment: sharedComment })
    const result = compileApplyNowPrompt({ manifest: manifest0, annotations: [ann1, ann2] })
    printPrompt('Scenario 4', result)
  })
})

describe('Scenario 5 — Apply Now: entire page, dislike + comment', () => {
  it('compiles CHANGE: overall constraint with full CSS scope instruction', () => {
    const ann = makeAnnotation({
      target:  makePageTarget(),
      type:    'dislike',
      comment: 'too dark overall, needs a warmer palette',
    })
    const result = compileApplyNowPrompt({ manifest: manifest0, annotations: [ann] })
    printPrompt('Scenario 5', result)
  })
})

describe('Scenario 6 — Apply Now: entire page, comment only', () => {
  it('compiles ADJUST: overall constraint', () => {
    const ann = makeAnnotation({
      target:  makePageTarget(),
      type:    'comment',
      comment: 'increase spacing between all sections',
    })
    const result = compileApplyNowPrompt({ manifest: manifest0, annotations: [ann] })
    printPrompt('Scenario 6', result)
  })
})

// ─── Chat Send: Scenarios 7–11 ───────────────────────────────────────────────

describe('Scenario 7 — Chat Send: cross-variant, single elements', () => {
  it('compiles per-variant element constraints with current props', () => {
    const annotations: Annotation[] = [
      makeAnnotation({ target: makeElementTarget('.name',    0), type: 'like',    comment: 'perfect weight' }),
      makeAnnotation({ target: makeElementTarget('.nav-bar', 1), type: 'dislike', comment: 'too dark, try lighter gray' }),
      makeAnnotation({ target: makeElementTarget('.bio',     2), type: 'comment', comment: 'increase line-height' }),
    ]
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [manifest0, manifest1, manifest2],
      annotations,
      userInstruction:     'More breathing room throughout',
      conversationHistory: conversationHistory,
    })
    printPrompt('Scenario 7', result)
  })
})

describe('Scenario 8 — Chat Send: cross-variant, multi-select groups', () => {
  it('compiles group constraints across variants', () => {
    const sharedComment = 'cards feel disconnected'
    const annotations: Annotation[] = [
      // Group on variant 0
      makeAnnotation({ target: makeElementTarget('.publication-card', 0), type: 'comment', comment: sharedComment }),
      makeAnnotation({ target: makeElementTarget('.publication-tag',  0), type: 'comment', comment: sharedComment }),
      // Single on variant 1
      makeAnnotation({ target: makeElementTarget('.name', 1), type: 'like' }),
    ]
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [manifest0, manifest1, manifest2],
      annotations,
      userInstruction:     '',
      conversationHistory: conversationHistory,
    })
    printPrompt('Scenario 8', result)
  })
})

describe('Scenario 9 — Chat Send: cross-variant, page-level annotations', () => {
  it('compiles KEEP/CHANGE: overall Variant N entries', () => {
    const annotations: Annotation[] = [
      makeAnnotation({ target: makePageTarget(0), type: 'like' }),                         // KEEP overall Variant 0
      makeAnnotation({ target: makePageTarget(1), type: 'dislike', comment: 'too dense' }), // CHANGE overall — "too dense"
      makeAnnotation({ target: makePageTarget(2), type: 'dislike' }),                       // CHANGE overall Variant 2
    ]
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [manifest0, manifest1, manifest2],
      annotations,
      userInstruction:     'Keep the cleaner feel, push contrast',
      conversationHistory: conversationHistory,
    })
    printPrompt('Scenario 9', result)
  })
})

describe('Scenario 10 — Chat Send: cross-variant, mixed page + element + group', () => {
  it('compiles all levels ordered page → group → element per variant', () => {
    const sharedComment = 'love this styling'
    const annotations: Annotation[] = [
      // Variant 0 — page like
      makeAnnotation({ target: makePageTarget(0), type: 'like', comment: 'use as primary base' }),
      // Variant 0 — element group
      makeAnnotation({ target: makeElementTarget('.publication-card', 0), type: 'like', comment: sharedComment }),
      makeAnnotation({ target: makeElementTarget('.publication-tag',  0), type: 'like', comment: sharedComment }),
      // Variant 1 — page dislike + single element
      makeAnnotation({ target: makePageTarget(1), type: 'dislike' }),
      makeAnnotation({ target: makeElementTarget('.nav-bar', 1), type: 'comment', comment: 'too cluttered' }),
    ]
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [manifest0, manifest1, manifest2],
      annotations,
      userInstruction:     'Refine the layout density',
      conversationHistory: conversationHistory,
    })
    printPrompt('Scenario 10', result)
  })
})

describe('Scenario 11 — Chat Send: no annotations, fresh generation', () => {
  it('builds fresh generation prompt with no variants or history', () => {
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [],
      annotations:         [],
      userInstruction:     'Clean Swiss academic style, muted palette',
      conversationHistory: [],
    })
    printPrompt('Scenario 11a — first-ever round', result)
  })

  it('builds fresh generation prompt with conversation history (mid-session reset)', () => {
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [manifest0, manifest1, manifest2],
      annotations:         [],
      userInstruction:     'Start fresh — bold editorial style instead',
      conversationHistory: conversationHistory,
    })
    printPrompt('Scenario 11b — mid-session fresh start', result)
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge case — annotation on element with no existing CSS rule', () => {
  it('includes annotation with Current: (no existing rule)', () => {
    const ann = makeAnnotation({
      target:  makeElementTarget('.nonexistent-selector'),
      type:    'comment',
      comment: 'add a subtle border',
    })
    const emptyManifest = makeManifest('classic', '.name { color: #000; }')
    const result = compileApplyNowPrompt({ manifest: emptyManifest, annotations: [ann] })
    printPrompt('Edge — missing CSS rule', result)
  })
})

describe('Edge case — manifest with empty CSS', () => {
  it('shows "(no CSS yet — style from scratch)" instead of empty block', () => {
    const ann = makeAnnotation({
      target:  makePageTarget(),
      type:    'comment',
      comment: 'go for a minimalist warm palette',
    })
    const noCSS = makeManifest('classic', '')
    const result = compileApplyNowPrompt({ manifest: noCSS, annotations: [ann] })
    printPrompt('Edge — empty CSS', result)
  })
})

describe('Edge case — annotations only, no userInstruction (Chat Send)', () => {
  it('omits the Additional Instruction section', () => {
    const annotations: Annotation[] = [
      makeAnnotation({ target: makeElementTarget('.name', 0), type: 'like' }),
    ]
    const result = compileChatSendPrompt({
      caseName:            CASE_NAME,
      manifests:           [manifest0],
      annotations,
      userInstruction:     '',       // empty — section should be omitted
      conversationHistory: [],
    })
    printPrompt('Edge — no userInstruction', result)
  })
})

describe('Edge case — throws on fully empty input', () => {
  it('compileApplyNowPrompt throws when annotations is empty', () => {
    let threw = false
    try {
      compileApplyNowPrompt({ manifest: manifest0, annotations: [] })
    } catch {
      threw = true
    }
    if (!threw) throw new Error('Expected an error but none was thrown')
    console.log('    → correctly threw for empty annotations')
  })

  it('compileChatSendPrompt throws when both annotations and instruction are empty', () => {
    let threw = false
    try {
      compileChatSendPrompt({
        caseName: CASE_NAME, manifests: [manifest0], annotations: [], userInstruction: '', conversationHistory: [],
      })
    } catch {
      threw = true
    }
    if (!threw) throw new Error('Expected an error but none was thrown')
    console.log('    → correctly threw for empty annotations + empty instruction')
  })
})

console.log('\n\nAll scenarios complete.\n')
