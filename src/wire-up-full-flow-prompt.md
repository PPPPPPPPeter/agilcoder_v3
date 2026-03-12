# Wire Up End-to-End Flow: UI → PromptCompiler → LLMService → Parser → UI State

## What to do

Connect the existing UI components to the three backend modules (`src/api/promptGenerator`, `src/api/llmService.ts`, `src/api/llmResponseParser.ts`) so that every user interaction produces real results. Currently the Chat tab Send and Action Popover Apply Now use mock data — replace all mocks with the real pipeline.

Read these before starting:
- `src/api/promptGenerator/` — PromptCompiler, exposes `compileChatSendPrompt` and `compileApplyNowPrompt`
- `src/api/llmService.ts` — exposes `callLLM`, `setApiKey`, `hasApiKey`
- `src/api/llmResponseParser.ts` — exposes `parseGenerateVariantsResponse`, `parseRefineVariantsResponse`, `parseApplyNowResponse`
- `ChatContext` — manages messages, pendingAnnotations, currentRound
- `FeedbackSelectionContext` — manages selected element, feedback mode
- The manifest engine API reference for `manifestRender`, `createManifest`, `getPreset`

Search for `====== MOCK` in the codebase to find all mock placeholders that need to be replaced.

---

## 1. API Key Setup

Add an API key input to the UI. Simplest approach: a small settings icon (⚙️) in the top-right corner of the right panel. Clicking it opens a minimal settings popover with:
- A password-type input for the Anthropic API key
- A "Save" button that calls `setApiKey(value)`
- A status indicator: ✓ configured / ✗ not set

If the user tries to Send or Apply Now without a key, show an inline error in the Chat tab: "Please set your Anthropic API key in Settings (⚙️ icon)."

---

## 2. Chat Tab Send — Full Flow

Replace the mock in `ChatContext.sendMessage()`. The new flow:

```typescript
async function sendMessage(text: string) {
  // 1. Gather inputs
  const annotations = [...pendingAnnotations];
  const manifests = currentManifests;         // current variant manifests (may be empty)
  const history = messages;

  // 2. Append user message to chat immediately (optimistic UI)
  const userMsg: ChatMessage = {
    id: generateId(),
    role: 'user',
    text,
    annotations: annotations.length > 0 ? annotations : undefined,
    timestamp: Date.now(),
  };
  addMessage(userMsg);
  clearPendingAnnotations();

  // 3. Show loading state
  setLoading(true);

  try {
    // 4. Check API key
    if (!hasApiKey()) throw new Error("Please set your Anthropic API key in Settings.");

    // 5. Compile prompt
    const prompt = compileChatSendPrompt(manifests, annotations, text, history);

    // 6. Call LLM
    const rawResponse = await callLLM(prompt);

    // 7. Parse response — branch based on scenario
    const isFirstRound = manifests.length === 0;
    const hasAnnotations = annotations.length > 0;

    let newManifests: Manifest[];
    let metadata: Array<{ summary: string; approach: string }>;

    if (isFirstRound || (!hasAnnotations && text)) {
      // Scenario 11: fresh generation
      const parsed = parseGenerateVariantsResponse(rawResponse, caseName, contentPreset);
      if (!parsed.success) throw new Error(parsed.errors.join('; '));
      newManifests = parsed.manifests;
      metadata = parsed.metadata;
    } else {
      // Scenarios 7–10: refinement
      const parsed = parseRefineVariantsResponse(rawResponse, manifests);
      if (!parsed.success) throw new Error(parsed.errors.join('; '));
      newManifests = parsed.manifests;
      metadata = parsed.metadata;
      // If there are conflicts, show them in chat
      if (parsed.conflicts.length > 0) {
        addMessage({
          id: generateId(),
          role: 'assistant',
          text: `⚠️ Conflicts detected:\n${parsed.conflicts.join('\n')}`,
          timestamp: Date.now(),
        });
      }
    }

    // 8. Update UI state
    setCurrentManifests(newManifests);
    setVariantMetadata(metadata);       // store summary/approach for each variant
    incrementRound();

    // 9. Update header thumbnails — re-render all variants via manifestRender()
    //    and update the thumbnail strip with new previews
    renderAndDisplayVariants(newManifests);

    // 10. Append assistant message
    addMessage({
      id: generateId(),
      role: 'assistant',
      text: `Generated ${newManifests.length} variants`,
      roundNumber: currentRound + 1,
      variantCount: newManifests.length,
      timestamp: Date.now(),
    });

  } catch (error) {
    // 11. Show error in chat
    addMessage({
      id: generateId(),
      role: 'assistant',
      text: `❌ ${error.message}`,
      timestamp: Date.now(),
    });
  } finally {
    setLoading(false);
  }
}
```

### Loading state UI

While waiting for the LLM response:
- Disable the Send button, show a spinner or pulsing dots inside it
- Show a temporary "Generating..." message bubble in the chat history
- Disable the header thumbnails (no switching during generation)
- Remove the "Generating..." bubble once the real response arrives

---

## 3. Apply Now — Full Flow

Replace the mock in the Action Popover's "Apply Now" handler:

```typescript
async function handleApplyNow(annotations: Annotation[]) {
  const manifest = currentManifests[activeVariantIndex];

  setApplyingNow(true);

  try {
    if (!hasApiKey()) throw new Error("Please set your API key in Settings.");

    // 1. Compile prompt
    const prompt = compileApplyNowPrompt(manifest, annotations);

    // 2. Call LLM
    const rawResponse = await callLLM(prompt);

    // 3. Parse and apply patches
    const parsed = parseApplyNowResponse(rawResponse, manifest);

    if (!parsed.success) throw new Error(parsed.errors.join('; '));

    // 4. Replace the current variant's manifest in-place
    updateManifestAtIndex(activeVariantIndex, parsed.manifest);

    // 5. Re-render only the active variant preview (not all thumbnails)
    rerenderActivePreview(parsed.manifest);

    // 6. Update the thumbnail for this variant only
    updateThumbnailAtIndex(activeVariantIndex);

    // 7. Attach the annotation(s) to Chat tab for the record
    annotations.forEach(a => addAnnotation({ ...a, immediate: true }));

    // 8. Close the popover
    closePopover();

    // 9. Brief success toast or flash on the affected element(s)
    showToast(`Applied ${parsed.appliedCount} changes`);

  } catch (error) {
    showToast(`❌ ${error.message}`);
  } finally {
    setApplyingNow(false);
  }
}
```

### Apply Now loading state
- Show a small spinner on the "Apply Now" button
- Keep the popover open during loading so the user sees progress
- On success: close popover, flash the element briefly
- On error: show error text below the Apply Now button in the popover, keep popover open

---

## 4. Variant Metadata Display

The LLM now returns `summary` and `approach` for each variant. Display these:

- **Header thumbnails**: show the `summary` as a tooltip on hover over each thumbnail. If it's long, truncate to ~60 chars in the tooltip.
- **Thumbnail label**: update from `Variant N: {preset}` to `Variant N: {approach}` (e.g., "Variant 1: conservative"). Fall back to preset name if no metadata yet (before first LLM call).
- **Preview area**: when viewing a variant, show a small info bar below the breadcrumb (or at the top of the preview) with the full `summary` text. This helps the user understand what they're looking at.

---

## 5. Error Recovery UX

- If the LLM returns unparseable JSON: show error in Chat tab, preserve current variants unchanged, let user retry.
- If some variants parse but others fail: show the successful ones, note in Chat which ones failed (e.g., "Generated 2 of 3 variants. Variant 3 had a parsing error.").
- If Apply Now patches partially apply: show the result with a note ("Applied 2 of 4 changes. Some patches were invalid.").
- All errors should be non-destructive — never lose the user's current state.

---

## 6. Delete All Mock Data

After wiring up, search the entire codebase for `====== MOCK` and remove every mock block. Specifically:
- Mock annotations in ChatContext
- Mock assistant responses in sendMessage
- Mock Apply Now console.log in Action Popover
- Any hardcoded test data used for visual testing

Verify that the app works end-to-end:
1. User sets API key → ✓ indicator
2. User types style description → Send → 3 variant thumbnails appear with real CSS
3. User previews variants, leaves feedback → annotations appear in Chat tab
4. User types refinement + Send → 3 new variants (patches applied)
5. User selects element → Apply Now → element updates in-place
6. Errors display gracefully, current state is never lost
