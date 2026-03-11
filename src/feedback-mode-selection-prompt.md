# Implement Feedback Mode: Click-to-Select Element Selection

## What to build

The "Feedback mode" toggle button in the bottom bar should activate a **click-to-select mode** on the currently previewed UI. When active, clicking any element in the preview selects it for feedback/fine-tuning.

Refer to the `@manifest/engine` API reference (already in context) for `extractSelectors()`, JSON Pointer paths, and Patch format — the selection data model should align with these.

## Core behavior

### Toggle
- "Feedback mode" button toggles the mode on/off with a clear visual active state.
- When active, **all default interactions in the preview are suppressed** (links, buttons, etc. do not fire) — attach a single capture-phase click listener on the preview container that calls `e.preventDefault()` and `e.stopPropagation()`, then uses `e.target` to identify the clicked element.
- When deactivated, the listener is removed. Current selection is preserved but highlight UI hides.

### Click to select
- Click any element → it gets a visible selection indicator (blue outline or similar).
- One selection at a time. Click a different element → replaces selection. Click the same element → deselects.
- Click the root container (empty area) → selects the entire page (global-level feedback).

### Hover hint (lightweight)
- When feedback mode is active, add `cursor: crosshair` to the preview container.
- On hover, apply a subtle outline (e.g. `outline: 1px dashed rgba(59,130,246,0.5)`) to the element under the cursor via a mouseover/mouseout listener. This is purely cosmetic — no overlay, no `elementFromPoint`, just direct event targeting.

### Breadcrumb bar
When an element is selected, show a breadcrumb at the top of the preview area:
`Page > .sidebar > .profile-section > .name`
Each segment is clickable to re-select that ancestor. This is the hierarchy navigation mechanism (replaces the previous scroll-wheel approach).

### Selection data model

```typescript
interface SelectionTarget {
  scopeId: string;
  variantIndex: number;
  contentPath: string | null;    // from nearest data-content-path attribute
  cssSelector: string | null;    // matched against extractSelectors(manifest.css)
  level: 'page' | 'section' | 'element' | 'text';
  label: string;
}
```

Resolve `contentPath` from the nearest `data-content-path` attribute (walk up DOM). Resolve `cssSelector` by matching element classes against `extractSelectors(manifest.css)`. Add `data-content-path` attributes to skeleton components if not already present.

### Selection info strip
Small strip at the top of the right panel showing the selected element's label and a × to deselect. Persists across tab switches.

### Context
Expose via React context:

```typescript
interface FeedbackSelectionContext {
  feedbackModeActive: boolean;
  selectedTarget: SelectionTarget | null;
  toggleFeedbackMode: () => void;
  selectElement: (target: SelectionTarget) => void;
  clearSelection: () => void;
}
```
