# Implement LLMService and LLMResponseParser Modules

Two modules to implement. LLMService handles API communication. LLMResponseParser handles turning raw LLM JSON into usable manifests/patches via `@manifest/engine`.

Refer to the `@manifest/engine` API reference (already in context) for `createManifest`, `getPreset`, `validateManifest`, `applyBatch`, `validatePatch`, `PatchEngine`, and `getLayoutsForCase`.

Also read the `PromptCompiler` module at `src/api/promptGenerator/` — LLMService consumes its `{ system, user }` output directly.

---

## Module 1: LLMService — `src/api/llmService.ts`

A thin API client. Its only job is: take a `{ system, user }` prompt pair, send it to Claude, return the raw response text. No parsing, no manifest logic.

### API key management

```typescript
let apiKey: string | null = null;

/**
 * Set the API key at runtime. Called from the Settings UI.
 * The key is stored in memory only — never persisted to disk or localStorage.
 */
export function setApiKey(key: string): void

/**
 * Check if an API key is configured.
 */
export function hasApiKey(): boolean
```

The UI should have a settings area (or a first-run prompt) where the user pastes their Anthropic API key. That UI calls `setApiKey()`. If no key is set when a call is made, throw a clear error: `"No API key configured. Please set your Anthropic API key in Settings."`.

### Core function

```typescript
/**
 * Send a prompt to Claude and return the raw text response.
 *
 * Called by: Chat tab "Send" handler, Action Popover "Apply Now" handler.
 * Input: { system, user } from PromptCompiler.
 * Output: raw string (expected to be JSON, but this module does NOT parse it).
 *
 * Uses Claude claude-sonnet-4-20250514 model via the Anthropic Messages API.
 */
export async function callLLM(prompt: {
  system: string;
  user: string;
}): Promise<string>
```

### Implementation details

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514`
- **Max tokens**: `4096` (CSS + patches can be long)
- **Headers**:
  ```
  Content-Type: application/json
  x-api-key: {apiKey}
  anthropic-version: 2023-06-01
  ```
- **Request body**:
  ```json
  {
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 4096,
    "system": "{prompt.system}",
    "messages": [
      { "role": "user", "content": "{prompt.user}" }
    ]
  }
  ```
- **Response handling**: Extract the text from `response.content[0].text`. Return this raw string.
- **Error handling**:
  - No API key → throw with setup instructions
  - HTTP 401 → throw `"Invalid API key"`
  - HTTP 429 → throw `"Rate limited. Please wait and try again."`
  - HTTP 5xx → throw `"Claude API is temporarily unavailable"`
  - Network error → throw `"Network error. Check your connection."`
  - All errors should be catchable by the caller to display in the Chat tab as an error message.

### Optional: streaming support (future)

Add a placeholder for streaming that just falls back to the non-streaming path for now:

```typescript
/**
 * Future: stream responses for real-time UI updates.
 * Currently falls back to callLLM().
 */
export async function callLLMStream(
  prompt: { system: string; user: string },
  onChunk?: (text: string) => void
): Promise<string>
```

---

## Module 2: LLMResponseParser — `src/api/llmResponseParser.ts`

Takes the raw string from LLMService, parses the JSON, validates it, and transforms it into manifests or patched manifests using `@manifest/engine`. This is where all the error recovery and validation happens.

### Function 1: `parseGenerateVariantsResponse`

For scenario 11 (fresh generation). LLM returned `{ variants: [{ layout, css, summary, approach }] }`.

```typescript
/**
 * Parse a fresh-generation response into Manifest objects.
 *
 * Called by: Chat tab Send handler after callLLM(), when it's a first-round / no-annotation send.
 *
 * Steps:
 * 1. Parse JSON from raw string (strip markdown fences if present)
 * 2. Validate structure: must have `variants` array
 * 3. For each variant:
 *    a. Validate `layout` is in getLayoutsForCase(caseName)
 *    b. Validate `css` is a string
 *    c. Assemble manifest: createManifest({ caseName, preset: contentPreset, content: getPreset(caseName, contentPreset), layout: variant.layout, css: variant.css })
 *    d. Validate assembled manifest via validateManifest()
 * 4. Return assembled manifests + metadata
 */
export function parseGenerateVariantsResponse(
  raw: string,
  caseName: string,
  contentPreset: string
): ParsedGenerateResult

interface ParsedGenerateResult {
  success: boolean;
  manifests: Manifest[];          // assembled manifests ready to render
  metadata: Array<{
    summary: string;              // from LLM, for display to user
    approach: string;             // from LLM, for display to user
  }>;
  errors: string[];               // any validation errors (non-fatal if some variants succeeded)
}
```

**Error recovery**:
- If JSON parsing fails, try to extract JSON from markdown code fences (` ```json ... ``` `).
- If a variant has an invalid layout, fall back to the first available layout for the case.
- If a variant's CSS contains forbidden properties, log a warning but include the variant anyway (CSS will just not affect those properties since skeletons don't use them).
- If some variants parse successfully and others fail, return the successful ones + errors for the failed ones. Don't throw.

### Function 2: `parseRefineVariantsResponse`

For scenarios 7–10 (refinement with annotations). LLM returned `{ variants: [{ baseVariantIndex, patches, summary, approach }], conflicts }`.

```typescript
/**
 * Parse a refinement response and apply patches to produce new manifests.
 *
 * Called by: Chat tab Send handler after callLLM(), when annotations exist.
 *
 * Steps:
 * 1. Parse JSON from raw string
 * 2. Validate structure: must have `variants` array
 * 3. For each variant:
 *    a. Validate `baseVariantIndex` is within range of currentManifests
 *    b. Validate each patch via validatePatch()
 *    c. Apply patches: applyBatch(currentManifests[baseVariantIndex], patches)
 *    d. Validate resulting manifest via validateManifest()
 * 4. Return new manifests + metadata + any conflicts
 */
export function parseRefineVariantsResponse(
  raw: string,
  currentManifests: Manifest[]
): ParsedRefineResult

interface ParsedRefineResult {
  success: boolean;
  manifests: Manifest[];          // patched manifests ready to render
  metadata: Array<{
    baseVariantIndex: number;
    summary: string;
    approach: string;
  }>;
  conflicts: string[];            // from LLM's conflict detection
  errors: string[];
}
```

**Error recovery**:
- If `baseVariantIndex` is out of range, default to index 0.
- If a patch fails validation, skip it and continue with remaining patches. Log the skipped patch in errors.
- If `applyBatch` throws, catch it, return the unpatched base manifest for that variant, add error.
- Partial success is OK — return whatever worked.

### Function 3: `parseApplyNowResponse`

For scenarios 1–6 (Apply Now, in-place element edit). LLM returned `{ patches: [...] }`.

```typescript
/**
 * Parse an Apply Now response and apply patches to the current manifest.
 *
 * Called by: Action Popover "Apply Now" handler after callLLM().
 *
 * Steps:
 * 1. Parse JSON from raw string
 * 2. Validate structure: must have `patches` array
 * 3. Validate each patch via validatePatch()
 * 4. Apply patches: applyBatch(manifest, patches)
 * 5. Validate resulting manifest
 * 6. Return new manifest
 */
export function parseApplyNowResponse(
  raw: string,
  manifest: Manifest
): ParsedApplyNowResult

interface ParsedApplyNowResult {
  success: boolean;
  manifest: Manifest;             // patched manifest (or original if all patches failed)
  appliedCount: number;           // how many patches were successfully applied
  skippedCount: number;           // how many patches failed validation
  errors: string[];
}
```

**Error recovery**:
- Same strategy: skip invalid patches, apply valid ones, return partial result.
- If ALL patches fail, return the original manifest unchanged with `success: false`.

### Shared: `safeParseJSON(raw)`

Internal helper used by all three parse functions:

```typescript
function safeParseJSON(raw: string): { data: any; error: string | null } {
  // 1. Try direct JSON.parse
  // 2. If fails, try stripping ```json ... ``` fences
  // 3. If fails, try extracting first { ... } or [ ... ] block
  // 4. If all fail, return { data: null, error: "Failed to parse LLM response as JSON" }
}
```

---

## File structure

```
src/api/
  llmService.ts           — API client (setApiKey, callLLM, callLLMStream)
  llmResponseParser.ts    — JSON parsing + manifest assembly/patching
  promptGenerator/        — (already implemented) PromptCompiler
    index.ts
    ...
```

## Integration notes

- These modules do NOT import React or use any hooks/context. They are pure TypeScript.
- The Chat tab Send handler orchestrates the full flow: `PromptCompiler → callLLM → Parser → update state`.
- The Action Popover Apply Now handler does the same but with the Apply Now variants of compiler and parser.
- All error messages from LLMService and Parser should be user-friendly strings that can be displayed directly in the Chat tab as an error message bubble.
