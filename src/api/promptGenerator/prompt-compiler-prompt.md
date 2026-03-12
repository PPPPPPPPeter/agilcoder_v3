# Implement PromptCompiler Module

## What to build

A `PromptCompiler` module at `src/api/promptGenerator` that transforms user inputs (annotations, text instructions, manifests) into structured prompt objects (`{ system, user }`) ready to be sent to an LLM.

This module is **pure logic** — no API calls, no React, no side effects. It is triggered in two places:
- User clicks **"Send"** in the Chat tab
- User clicks **"Apply Now"** in the Action Popover

Read the `@manifest/engine` API reference (already in context). The module will import and call these engine functions:
- `extractSelectors(css)` — get all selectors from a manifest's CSS
- `extractProperties(css, selector)` — get current property values for a specific selector
- `getLayoutsForCase(caseName)` — get available layouts for the system prompt preamble

Also read `ChatContext` and `FeedbackSelectionContext` to understand the `Annotation`, `SelectionTarget`, and `ChatMessage` types.

---

## Constraint model (simplified)

Only two constraint types:

| User action | Constraint | With comment |
|------------|-----------|-------------|
| 👍 Like | `KEEP: {target}` | `KEEP: {target} — "{comment}"` |
| 👎 Dislike | `CHANGE: {target} — restyle differently` | `CHANGE: {target} — "{comment}"` |
| 💬 Comment only | `ADJUST: {target} — "{comment}"` | — |

This applies uniformly regardless of scope (element, multi-select group, or entire page). No DISCARD — a disliked page is just `CHANGE: overall Variant {N} — restyle differently`.

When like/dislike and comment both exist on the same target, **merge into one constraint**:
- 👍 + 💬 → `KEEP: .name — "{comment}"` (preserve overall, tweak per comment)
- 👎 + 💬 → `CHANGE: .name — "{comment}"` (restyle, guided by comment)

---

## Module structure: `src/api/promptGenerator/`

```
src/api/promptGenerator/
  index.ts                  — public exports
  buildSystemPreamble.ts    — shared system prompt preamble
  compileAnnotations.ts     — Annotation[] → constraint text block
  compileApplyNowPrompt.ts  — for Apply Now (scenarios 1–6)
  compileChatSendPrompt.ts  — for Chat Send (scenarios 7–11)
```

---

## Shared: `buildSystemPreamble(caseName)`

Returns the system prompt preamble included in every prompt. Contains:

```
You are a UI style generator. Output ONLY valid JSON — no explanations, no markdown.

Case: {caseName}
Available layouts: {getLayoutsForCase(caseName).join(', ')}

Content and meta are managed by the system — you never generate or modify them.
You only output CSS styling and layout choices (for new variants) or Patch objects (for refinements).

Allowed CSS properties (ONLY these — any other property is FORBIDDEN):
- Palette: background, color, border-color, opacity
- Typography: font-family, font-size, font-weight, line-height, letter-spacing
- Shape: border-radius, border-width, border-style
- Spacing: padding, margin, gap, max-width
- Depth: box-shadow, backdrop-filter, filter
- Motion: transition, transform, animation

Patch format: { op: "css", selector: string, property: string, value: string }
```

---

## Internal: `compileAnnotations(annotations, manifests)`

Takes `Annotation[]` and current `Manifest[]`. Returns a formatted constraint text block.

**Logic:**

1. Group annotations by `variantIndex`.
2. Within each variant group, merge annotations that target the same element(s) — if both a like/dislike and a comment exist for the same selector, merge into one constraint line.
3. For multi-select annotations (multiple targets in one annotation), mark as a group.
4. For every KEEP constraint, extract and include current CSS properties using `extractProperties(manifest.css, selector)`.
5. Order within each variant group: page-level → group-level → element-level.

**Output example:**

```
[Variant 0]
KEEP: overall style — use as primary base
ADJUST: .bio — "make longer line length"
  Current: { max-width: '42rem', line-height: '1.625' }

[Variant 1]
CHANGE: .nav-bar — "too dark, try lighter gray"
  Current: { background: '#1e293b', color: '#f1f5f9' }
KEEP (group): .publication-card, .publication-tag — "love this styling"
  .publication-card → { padding: '0.75rem', border: '1px solid #e5e7eb' }
  .publication-tag → { font-size: '0.625rem', background: '#f3f4f6' }
  Note: Preserve these elements as a group.

[Variant 2]
CHANGE: overall — restyle differently
```

---

## Function 1: `compileApplyNowPrompt(manifest, annotations)`

For **Apply Now** — in-place edit on the current variant. Handles scenarios 1–6.

**Input:**
```typescript
{
  manifest: Manifest,         // current variant
  annotations: Annotation[],  // one or more annotations (single, multi-select, or page-level)
                               // all from the same variant
}
```

**Output:** `{ system: string, user: string }`

**System prompt** = `buildSystemPreamble(caseName)` + scope-specific instruction based on what was selected:

For element/multi-select targets:
```
Modify ONLY the targeted element(s). Do not change any other element.
The result must remain visually coherent with the rest of the page.
Respond with JSON: { "patches": [ { "op": "css", "selector": "...", "property": "...", "value": "..." }, ... ] }
```

For entire-page target:
```
Apply changes globally across the entire page.
Maintain visual coherence and consistency.
Respond with JSON: { "patches": [ ... ] }
```

**User prompt** structure:

```
Current page CSS:
"""
{manifest.css}
"""
Layout: {manifest.layout}

{compiled constraints from the annotations}

Respond with JSON: { "patches": [...] }
```

### Scenario handling within compileApplyNowPrompt:

| # | Input shape | Compiled constraint |
|---|------------|-------------------|
| 1 | Single element, like/dislike + comment | `KEEP/CHANGE: .name — "{comment}"` + current props |
| 2 | Single element, comment only | `ADJUST: .name — "{comment}"` + current props |
| 3 | Multi-select, like/dislike + comment | `KEEP/CHANGE (group): .name, .title, .affiliation — "{comment}"` + each element's current props + group coherence note |
| 4 | Multi-select, comment only | `ADJUST (group): .name, .title — "{comment}"` + props + group note |
| 5 | Entire page, like/dislike + comment | `KEEP/CHANGE: overall — "{comment}"` + full CSS |
| 6 | Entire page, comment only | `ADJUST: overall — "{comment}"` + full CSS |

---

## Function 2: `compileChatSendPrompt(manifests, annotations, userInstruction, conversationHistory)`

For **Chat tab Send** — generating new variants based on accumulated cross-variant feedback. Handles scenarios 7–11.

**Input:**
```typescript
{
  manifests: Manifest[],              // all current variants (may be empty on first round)
  annotations: Annotation[],          // pending annotations across all variants (may be empty)
  userInstruction: string,            // user's text input from Chat
  conversationHistory: ChatMessage[], // previous rounds
}
```

**Output:** `{ system: string, user: string }`

### Scenario detection logic:

```typescript
const isFirstRound = manifests.length === 0;
const hasAnnotations = annotations.length > 0;

if (isFirstRound || (!hasAnnotations && userInstruction)) {
  // Scenario 11: fresh generation, no feedback context
  // → ask for { layout, css }[]
} else {
  // Scenarios 7–10: refinement with feedback
  // → ask for patch sets against existing variants
}
```

### Scenario 11: Chat Send without annotations (fresh generation)

Same as Round 1. User just types a style description, no existing variants or feedback.

**System prompt** = `buildSystemPreamble(caseName)` +
```
Generate 3 distinct style interpretations of the user's description.
For each, choose a layout and write a complete CSS string.
Each variant should look noticeably different from the others.
Respond with JSON: { "variants": [ { "layout": "...", "css": "..." }, ... ] }
```

**User prompt:**
```
Style description: "{userInstruction}"
```

If there IS conversation history but no annotations (user wants to start fresh mid-conversation):
```
Previous rounds context:
  Round 1: "Clean Swiss style" → 3 variants
  Round 2: "More contrast" → 3 variants

New style description (fresh start): "{userInstruction}"
```

### Scenarios 7–10: Chat Send with annotations (refinement)

**System prompt** = `buildSystemPreamble(caseName)` +
```
Generate 3 refined style variants based on user feedback and instructions.
For each variant, choose an existing variant as base and return a patch set.
Respect all KEEP/CHANGE/ADJUST constraints.
Text instructions define the global direction. Element annotations are local constraints.
If they conflict, include a "conflicts" array explaining the tension.
Respond with JSON:
{
  "variants": [
    { "baseVariantIndex": 0, "patches": [...] },
    ...
  ],
  "conflicts": []
}
```

**User prompt:**
```
=== Conversation History ===
Round 1: "Clean Swiss style" → 3 variants
Round 2: "More contrast" → 3 variants (current)

=== Current Variants ===

Variant 0 (layout: sidebar-left):
"""
{manifests[0].css}
"""

Variant 1 (layout: classic):
"""
{manifests[1].css}
"""

Variant 2 (layout: hero-banner):
"""
{manifests[2].css}
"""

=== Feedback Constraints ===
{compileAnnotations(annotations, manifests)}

=== Additional Instruction ===
"{userInstruction}"

Respond with JSON: { "variants": [...], "conflicts": [] }
```

### Scenario handling within compileChatSendPrompt:

| # | Annotations shape | Compiled constraints |
|---|------------------|---------------------|
| 7 | Cross-variant, single elements | Per-variant element constraints with current props |
| 8 | Cross-variant, multi-select groups | Group constraints with coherence notes |
| 9 | Cross-variant, page-level | `KEEP/CHANGE: overall Variant {N}` — determines base selection |
| 10 | Cross-variant, mixed levels | Grouped by variant, ordered page → group → element |
| 11 | No annotations | No constraints block, ask for fresh `{ layout, css }[]` |

---

## Edge cases

- **Empty CSS in a manifest**: include `(no CSS yet — style from scratch)` instead of empty quotes.
- **Annotation on element with no existing CSS rule**: include the annotation anyway, note `Current: (no existing rule)`. LLM should create the rule.
- **No user instruction text but annotations exist**: valid — the constraints alone are sufficient input. Omit the "Additional Instruction" section.
- **No annotations and no user instruction**: disable Send button in the UI. The compiler should throw or return null if called with empty inputs.
- **Annotations all on one variant**: still use `compileChatSendPrompt` (Chat Send path), just the constraints block will only have one variant group.

## Testing

Add a `src/api/promptGenerator/__tests__/` folder with a test file that constructs mock inputs for each of the 11 scenarios and logs the compiled `{ system, user }` output. This allows visual inspection of prompt quality before wiring up to any LLM.
