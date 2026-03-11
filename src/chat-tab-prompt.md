# Implement Chat Tab in Right Panel

## What to build

Add a third tab called **"Chat"** to the right-side panel (alongside "Overall Style" and "Fine-Tune"). This tab is a lightweight conversation interface for communicating with the LLM about style generation and refinement. It does NOT replace the existing tabs — just add it as a new tab.

## Layout (top to bottom)

### 1. Conversation history (scrollable, takes up most of the space)

Displays the exchange between user and AI as a vertical message flow. Two message types:

- **User message**: shows the user's text prompt. If annotations were attached, show a small badge like `📎 3 annotations attached` below the text. The annotation badge is clickable to expand/collapse the list of individual annotations inline.
- **AI response**: do NOT show LLM's full output. Instead show a compact status card: `Generated 5 variants → Round 1`. The actual output is already visible as thumbnails in the header — no need to repeat it here.

The history should auto-scroll to the bottom on new messages.

### 2. Annotation summary (conditional, between history and input)

Only appears when the user has left annotations (via the feedback selection system already implemented) on the current round's variants. Shows a collapsible card:

- Collapsed: `📎 3 annotations on 2 variants`
- Expanded: list of individual annotations, each showing:
  - Variant number + element label (e.g. `Variant 1 · .name`)
  - The annotation type (👍 / 👎 / 💬) and comment text if any
  - A small × to remove individual annotations before sending

If no annotations exist, this section is completely hidden.

### 3. Input area (fixed at bottom)

- A text input (or small textarea) + send button.
- Dynamic placeholder:
  - First round (no variants generated yet): `"Describe the style you want..."`
  - After generation: `"Tell the AI what to change..."`
- If annotations exist, show a small count badge on or near the send button (e.g. `Send (3)`) to indicate how many annotations will be attached.
- Pressing Enter sends (Shift+Enter for newline if textarea). Send button disabled when input is empty AND no annotations exist.

## Data model

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;                          // user's prompt or AI's summary text
  annotations?: Annotation[];            // attached feedback (user messages only)
  roundNumber?: number;                  // which generation round this corresponds to
  variantCount?: number;                 // how many variants were generated (assistant messages only)
  timestamp: number;
}

// Annotation comes from the existing FeedbackSelectionContext.
// Each annotation references a SelectionTarget + feedback type.
interface Annotation {
  id: string;
  variantIndex: number;
  target: SelectionTarget;               // from the existing selection system
  type: 'like' | 'dislike' | 'comment';
  comment?: string;
}
```

Manage chat state with a context or store:

```typescript
interface ChatContext {
  messages: ChatMessage[];
  pendingAnnotations: Annotation[];      // collected from feedback mode, not yet sent
  currentRound: number;
  addAnnotation: (a: Annotation) => void;
  removeAnnotation: (id: string) => void;
  sendMessage: (text: string) => void;   // bundles text + pendingAnnotations into a ChatMessage, clears pending
}
```

## Integration with existing systems

- **FeedbackSelectionContext**: when the action popover is implemented later, it will call `ChatContext.addAnnotation()` to push annotations into the pending list. For now, just expose the `addAnnotation` method and render the pending list in the annotation summary section. You can add a few hardcoded mock annotations for visual testing.
- **LLM integration**: `sendMessage()` should for now just append the user message to history and immediately append a mock assistant response (`Generated 5 variants → Round N`). The actual LLM call will be wired up later.

## Critical: Mock data and interface documentation

### Mock data markers

All temporary mock data MUST be wrapped in clearly marked blocks with comments explaining what will replace them. Use this exact format:

```typescript
// ====== MOCK DATA — DELETE WHEN REAL DATA IS AVAILABLE ======
// Replace with: annotations pushed from ActionPopover via ChatContext.addAnnotation()
const MOCK_ANNOTATIONS: Annotation[] = [
  { id: 'mock-1', variantIndex: 0, target: { ... }, type: 'like' },
  { id: 'mock-2', variantIndex: 1, target: { ... }, type: 'comment', comment: 'Font too small' },
  { id: 'mock-3', variantIndex: 0, target: { ... }, type: 'dislike' },
];
// ====== END MOCK DATA ======
```

```typescript
// ====== MOCK RESPONSE — DELETE WHEN LLM IS INTEGRATED ======
// Replace with: actual LLM API call that takes { text, annotations, currentManifests }
// and returns new manifests. See sendToLLM() interface below.
const mockAssistantReply: ChatMessage = {
  id: generateId(),
  role: 'assistant',
  text: `Generated 5 variants`,
  roundNumber: currentRound + 1,
  variantCount: 5,
  timestamp: Date.now(),
};
// ====== END MOCK RESPONSE ======
```

### Interface documentation

Every exposed method and context property must have a JSDoc comment explaining:
1. What it does now (mock/placeholder behavior)
2. What it should do in the final version
3. Who will call it

```typescript
interface ChatContext {
  messages: ChatMessage[];
  pendingAnnotations: Annotation[];
  currentRound: number;

  /**
   * Add a feedback annotation to the pending list.
   * 
   * Current: can be called manually for testing.
   * Future: called by ActionPopover when user clicks 👍/👎/💬 on a selected element.
   * The annotation appears in the annotation summary section and will be
   * bundled with the next sendMessage() call.
   */
  addAnnotation: (a: Annotation) => void;

  /**
   * Remove a pending annotation by id.
   * 
   * Called from: the × button on individual annotation items in the
   * annotation summary section, allowing users to remove feedback
   * before sending.
   */
  removeAnnotation: (id: string) => void;

  /**
   * Send a message to the LLM along with all pending annotations.
   * 
   * Current (mock): appends user message + mock assistant response to history,
   * clears pendingAnnotations, increments currentRound.
   * 
   * Future: should compile { text, pendingAnnotations, currentManifests }
   * into a structured prompt, call the LLM, receive new manifests,
   * pass them to the manifest rendering pipeline, and append a real
   * assistant message with the actual variant count.
   * 
   * Called from: the send button / Enter key in the input area.
   */
  sendMessage: (text: string) => void;
}
```

## Style notes

- Keep the UI compact — this is a narrow side panel, not a full-page chat.
- Message bubbles should be minimal: no avatars, no markdown rendering. Just clean text with a subtle background color difference between user/AI messages.
- Match the visual style of the existing right panel (same fonts, colors, spacing).
