# StyleAgent — Project Documentation

> **Version:** 0.1.0
> **Package name:** `styleagent`
> **Status:** UI shell complete; LLM backend integration pending

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Directory Structure](#4-directory-structure)
5. [Architecture Overview](#5-architecture-overview)
6. [Application Layout Zones](#6-application-layout-zones)
7. [State Management](#7-state-management)
8. [Component Reference](#8-component-reference)
9. [Primitive UI Components](#9-primitive-ui-components)
10. [Hooks](#10-hooks)
11. [Context — ChatContext](#11-context--chatcontext)
12. [Manifest Rendering Engine API](#12-manifest-rendering-engine-api)
13. [Type Reference](#13-type-reference)
14. [Design System](#14-design-system)
15. [Mock Data](#15-mock-data)
16. [Feature Status & Roadmap](#16-feature-status--roadmap)

---

## 1. Project Overview

**StyleAgent** is an LLM-powered web style design tool. It lets users describe a visual style in natural language (e.g. "futuristic", "warm and cozy", "Morandi color palette"), after which the LLM generates multiple live-preview webpage variants. Users can browse, select, annotate (like/dislike), comment, and fine-tune these variants through both high-level style controls and per-element CSS adjustments.

The current codebase is the **UI shell**: all panels, interactions, and placeholder states are fully implemented. Backend LLM integration and real rendering-engine calls are mocked and marked for future wiring.

The first use case targets **academic homepages** — the preview content shows a realistic academic personal page (researcher profile, publications list, contact info) in five different layout styles.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.0.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 5.4.21 | Build tool & dev server |
| Tailwind CSS | 3.4.14 | Utility-first styling |
| Framer Motion | 11.18.2 | Animations & transitions |
| Lucide React | 0.446.0 | Icon library |
| Ant Design | 6.3.1 | Supplemental UI components |
| PostCSS | 8.4.47 | CSS transformation pipeline |

**Design constraints:**
- Desktop only; minimum viewport width 1200px.
- No authentication, no user accounts, no file uploads.
- No external state management library (React `useState`/`useReducer` only).

---

## 3. Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

### Type-check without building

```bash
npm run typecheck
```

### Preview production build locally

```bash
npm run preview
```

---

## 4. Directory Structure

```
agilcoder_v3/
├── index.html                        # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx                      # React app bootstrap
    ├── App.tsx                       # Root component
    ├── index.css                     # Global styles & Tailwind directives
    │
    ├── types/
    │   └── index.ts                  # All shared TypeScript types
    │
    ├── hooks/
    │   ├── useAppState.ts            # Global reducer (AppState + AppAction)
    │   ├── useKeyboardShortcuts.ts   # Cmd/Ctrl+Z / Cmd/Ctrl+Y undo-redo
    │   ├── usePanelResizer.ts        # Drag-resize for left/right panels
    │   └── useSlider.ts              # Generic draggable slider logic
    │
    ├── context/
    │   └── ChatContext.tsx           # Chat state + annotation management
    │
    ├── data/
    │   └── mockData.ts               # cssGroupDefs, font lists, default StyleValues
    │
    ├── primitives/
    │   ├── Slider.tsx                # Custom draggable slider
    │   ├── ColorSwatch.tsx           # Color picker (hex + native input)
    │   ├── Dropdown.tsx              # Select wrapper
    │   ├── Toggle.tsx                # On/off switch
    │   ├── Accordion.tsx             # Expandable section (Framer Motion)
    │   └── Tooltip.tsx               # Hover tooltip
    │
    ├── components/
    │   ├── Header/                   # Top bar: prompt input + variant strip
    │   │   ├── Header.tsx
    │   │   ├── PresetStrip.tsx       # Five preset thumbnails (academic personas)
    │   │   └── PresetThumbnail.tsx
    │   │
    │   ├── LeftPanel/                # Live preview area
    │   │   ├── LeftPanel.tsx
    │   │   ├── PreviewFrame.tsx      # Outer frame + scroll container
    │   │   ├── PreviewContent.tsx    # Routes to correct layout skeleton
    │   │   ├── MockAcademicPage.tsx  # Five layout implementations
    │   │   ├── FeedbackOverlay.tsx   # Click-to-select element overlay
    │   │   ├── ActionPopover.tsx     # Like/dislike/comment popover
    │   │   ├── SelectionBreadcrumb.tsx
    │   │   ├── FloatingControls.tsx  # Zoom, feedback toggle, open-in-tab
    │   │   └── AnnotationMarkers.tsx # Badge overlays on annotated elements
    │   │
    │   ├── RightPanel/               # Style controls + chat
    │   │   ├── RightPanel.tsx
    │   │   ├── ViewToggle.tsx        # Overall / Finetune / Chat tab switcher
    │   │   │
    │   │   ├── ChatView/
    │   │   │   ├── ChatView.tsx
    │   │   │   ├── MessageHistory.tsx
    │   │   │   ├── AnnotationSummary.tsx
    │   │   │   └── ChatInput.tsx
    │   │   │
    │   │   ├── OverallStyleView/
    │   │   │   ├── OverallStyleView.tsx
    │   │   │   ├── MasterSlider.tsx
    │   │   │   ├── ColorPaletteGroup.tsx
    │   │   │   ├── TypographyGroup.tsx
    │   │   │   ├── GeometryGroup.tsx
    │   │   │   ├── SpacingGroup.tsx
    │   │   │   ├── EffectsGroup.tsx
    │   │   │   └── AnimationGroup.tsx
    │   │   │
    │   │   └── FineTuneView/
    │   │       ├── FineTuneView.tsx
    │   │       ├── SelectionHeader.tsx
    │   │       └── PropertyInspector.tsx
    │   │
    │   ├── Footer/
    │   │   └── Footer.tsx            # Patch history timeline
    │   │
    │   └── PanelResizer.tsx          # Draggable vertical divider
    │
    ├── api/
    │   └── manifestRenderingEng/     # Core manifest pipeline (pure JS modules)
    │       ├── index.js              # Unified entry point
    │       ├── manifest-schema.js    # Validate / create / clone manifests
    │       ├── manifest-render.js    # Render pipeline → RenderDescriptor
    │       ├── patch-engine.js       # RFC-6902 patch apply + undo/redo
    │       ├── css-scoper.js         # Scope CSS selectors to a unique ID
    │       ├── css-patcher.js        # Surgical CSS string mutation
    │       ├── content-presets.js    # 10 built-in content presets
    │       ├── json-pointer.js       # RFC-6901 JSON Pointer implementation
    │       └── manifest-engine-api-reference.md
    │
    ├── styleagent-ui-design-prompt.md    # Original UI shell specification
    ├── chat-tab-prompt.md                # Chat tab feature specification
    ├── feedback-mode-selection-prompt.md # Feedback overlay specification
    └── skeleton-refactor-prompt.md       # Layout skeleton refactor notes
```

---

## 5. Architecture Overview

The application follows a single-page layout divided into four fixed zones:

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER — Preset strip + Prompt input + Actions              │
├───────────────────────────────┬─┬────────────────────────────┤
│                               │ │                            │
│   LEFT PANEL                  │R│   RIGHT PANEL              │
│   Live Preview                │E│   Style Controls + Chat    │
│                               │S│                            │
│                               │I│                            │
│                               │Z│                            │
├───────────────────────────────┴─┴────────────────────────────┤
│  FOOTER — Patch History Timeline                             │
└──────────────────────────────────────────────────────────────┘
```

**Default panel split:** 60% left / 40% right.
**Minimum widths:** left panel 400px, right panel 320px.
The `PanelResizer` component handles the drag interaction between panels.

**Global state** lives in a single `AppState` object managed by a `useReducer`-based hook (`useAppState`). Chat-specific state (messages, pending annotations) is managed separately in `ChatContext`.

---

## 6. Application Layout Zones

### Zone 1: Header

A fixed-height bar (72px) spanning the full viewport width.

- **Left region (~260px):** A compact text input displaying the current style prompt. An "Enter / send" icon button submits it. Placeholder: `"Describe a style…"`.
- **Center region (flexible, scrollable):** A horizontal thumbnail strip showing content presets (academic personas). Each thumbnail is 80×48px with a label. The active preset has an accent-coloured border + glow. A `+More` card at the end (dashed border) is a placeholder for future variant generation.
- **Right region (~120px):** An "Aggregate Feedback" button and a Download/Export button.

### Zone 2: Left Panel — Live Preview

Displays the currently active preset variant at full fidelity.

**Empty state:** Large centred prompt — "Describe a style to begin."

**Preview state:** Renders `MockAcademicPage` in one of five layouts inside `PreviewFrame`.

**Feedback Mode overlay** (toggled via `FloatingControls`):
- A semi-transparent overlay activates over the preview.
- Clicking any element adds a coloured 2px outline and triggers `ActionPopover`.
- `ActionPopover` offers 👍 Like, 👎 Dislike, 💬 Comment input, ⚡ Tweak, and Attach/Apply Now buttons.
- `AnnotationMarkers` render coloured badge overlays on all annotated elements.
- `SelectionBreadcrumb` shows the DOM path of the active selection.

**Floating controls (bottom-right):**
- 🔍 Zoom — toggles fit-to-panel vs. 100% scrollable.
- 💬 Feedback Mode toggle.
- ↗️ Open full-screen preview.

### Zone 3: Right Panel — Style Controls

Three tabs toggled by `ViewToggle`:

| Tab | Description |
|---|---|
| **Overall Style** | Master intensity slider + 6 accordion CSS-group sections |
| **Fine-Tune** | Per-element property inspector for selected preview elements |
| **Chat** | Conversation interface with annotation summary and send input |

#### Overall Style Tab

- **Master Slider:** Controls overall style intensity (less ↔ more). Anchor-point markers define the effective range.
- **CSS Group Accordions:** Six expandable sections, each containing controls specific to that CSS group.

| Group | Controls |
|---|---|
| Color Palette 🎨 | BG/text/accent color swatches, Contrast slider |
| Typography Aa | Heading font dropdown, Body font dropdown, Base size slider, Line height slider |
| Geometry ▢ | Border radius slider, Uniform radius toggle |
| Spacing ↔ | Density slider, Section gap slider |
| Effects ✦ | Shadow intensity slider, Hover lift slider, Backdrop blur toggle |
| Animation ▶ | Transition speed slider, Entrance animations toggle, Hover animations toggle |

#### Fine-Tune Tab

- **Empty state:** "Click an element in the preview to fine-tune it."
- **Selected state:** Shows element class name chip, parent-chain breadcrumb, and a scrollable `PropertyInspector` listing per-property controls (color picker, slider, dropdown, toggle, or segmented buttons depending on property type). A reset (↩) icon reverts individual properties. An "Add property" button opens a manual property input.

#### Chat Tab

- **Message history:** Scrollable vertical list. User messages show prompt text + an optional `📎 N annotations attached` badge. Assistant messages show a compact status card: `Generated N variants → Round N`.
- **Annotation summary:** Conditional panel between history and input. Shows pending annotations (from feedback mode) as a collapsible card. Each annotation displays: variant number, element label, annotation type icon, comment text, and an × remove button.
- **Input area:** Textarea + Send button. Placeholder changes based on whether any variants have been generated. The Send button shows `Send (N)` when annotations are pending. Enter sends; Shift+Enter inserts a newline. Disabled when both text and annotations are empty.

### Zone 4: Footer — Patch History Timeline

A fixed-height bar (48px) at the bottom of the viewport.

- **History label** (left, ~80px): "History" in muted text.
- **Timeline track** (flexible, scrollable): Horizontal row of nodes connected by a thin line. Each node is a circle (8px diameter) with a tooltip showing the patch summary.
  - Blue node: LLM-generated patch.
  - Green node: User patch.
  - Gray node: Undone patch (redo stack).
  - The current state node is slightly larger (10px) with a glow ring.
  - Clicking a node jumps history to that state.
- **Controls** (right, ~160px): Undo (←), Redo (→), and a change count badge. Keyboard shortcut hints displayed inline (⌘Z / ⌘⇧Z).

---

## 7. State Management

### AppState

Managed by `useAppState` (`src/hooks/useAppState.ts`) using `useReducer`. The full state shape:

```typescript
interface AppState {
  prompt: string;
  hasGenerated: boolean;
  selectedVariantId: string | null;
  variants: Variant[];
  selectedPreset: ContentPreset | null;
  historyByVariant: Record<string, HistoryNode[]>;
  currentHistoryIndex: Record<string, number>;
  rightPanelView: 'overall' | 'finetune' | 'chat';
  panelLeftWidthPct: number;
  feedbackModeActive: boolean;
  annotatedElements: AnnotatedElement[];
  selectedElements: SelectedElement[];
  selectionTargets: SelectionTarget[];
  styleValues: Record<string, StyleValues>;
  openAccordions: CSSGroupId[];
  previewZoomed: boolean;
}
```

### AppAction — Dispatched Actions

| Action type | Payload | Effect |
|---|---|---|
| `SET_PROMPT` | `string` | Update style prompt text |
| `GENERATE_VARIANTS` | — | Trigger variant generation (mock) |
| `SELECT_VARIANT` | `string` (variantId) | Switch active variant |
| `SET_RIGHT_PANEL_VIEW` | `'overall' \| 'finetune' \| 'chat'` | Switch right panel tab |
| `SET_PANEL_WIDTH` | `number` (percentage) | Update left panel width |
| `TOGGLE_FEEDBACK_MODE` | — | Toggle feedback overlay |
| `TOGGLE_ELEMENT_ANNOTATION` | `AnnotatedElement` | Add/remove element annotation |
| `CLEAR_ANNOTATIONS` | — | Remove all annotations |
| `SET_ELEMENT_REACTION` | `{ selector, reaction }` | Set like/dislike on element |
| `SET_ELEMENT_COMMENT` | `{ selector, comment }` | Set comment on element |
| `UPDATE_STYLE_VALUE` | `{ variantId, key, value }` | Commit style value change |
| `UPDATE_STYLE_VALUE_LIVE` | `{ variantId, key, value }` | Live-preview style value (no history entry) |
| `TOGGLE_ACCORDION` | `CSSGroupId` | Expand/collapse CSS group section |
| `UNDO` | — | Undo last history node |
| `REDO` | — | Redo last undone node |
| `JUMP_TO_HISTORY` | `{ variantId, index }` | Jump to a specific history node |
| `ADD_VARIANT_ANNOTATION` | `{ variantId, annotation }` | Set like/dislike on whole variant |
| `SELECT_PREVIEW_ELEMENT` | `SelectedElement \| null` | Set fine-tune selection |
| `TOGGLE_ZOOM` | — | Toggle preview zoom |
| `GENERATE_MORE_VARIANTS` | — | Generate additional variants (mock) |
| `SELECT_PRESET` | `ContentPreset \| null` | Select a content preset |
| `SET_SELECTION_TARGETS` | `SelectionTarget[]` | Register clickable targets in overlay |
| `TOGGLE_MULTI_SELECT` | `SelectionTarget` | Add/remove from multi-selection |

### ChatContext

Managed by `ChatContext` (`src/context/ChatContext.tsx`).

```typescript
interface ChatContextValue {
  messages: ChatMessage[];
  pendingAnnotations: Annotation[];
  currentRound: number;
  addAnnotation: (a: Annotation) => void;
  removeAnnotation: (id: string) => void;
  sendMessage: (text: string) => void;
  hoveredVariantIndex: number | null;
  pendingNavigation: Annotation | null;
  highlightedAnnotationId: string | null;
}
```

**Current behaviour (mock):** `sendMessage()` appends the user message and a hardcoded assistant response to history, clears `pendingAnnotations`, and increments `currentRound`. Real LLM integration will replace this stub.

---

## 8. Component Reference

### Header Components

#### `Header`
Root header component. Renders `PresetStrip` on the left and action buttons on the right.

#### `PresetStrip`
Horizontally scrollable strip of five `PresetThumbnail` cards representing academic persona presets. The active preset receives an accent border.

#### `PresetThumbnail`
Single preset card (80×48px). Shows a coloured background and variant label. Clicking dispatches `SELECT_PRESET`.

---

### Left Panel Components

#### `LeftPanel`
Outer wrapper that contains `PreviewFrame` and `FloatingControls`.

#### `PreviewFrame`
Scroll container for the preview. Hosts `PreviewContent`, `FeedbackOverlay`, and `AnnotationMarkers`.

#### `PreviewContent`
Routes to the correct `MockAcademicPage` layout sub-component based on the active layout name.

#### `MockAcademicPage`
Renders an academic personal homepage in one of five layouts:

| Layout ID | Description |
|---|---|
| `classic` | Single-column linear layout |
| `sidebar-left` | Two-column: sidebar on the left |
| `sidebar-right` | Two-column: sidebar on the right |
| `hero-banner` | Dark hero header + split body |
| `compact` | Minimal centred layout |

All layouts share the same CSS class names (`.academic-page`, `.nav-bar`, `.header`, `.name`, `.bio`, `.pub-card`, etc.) as specified by the manifest schema.

#### `FeedbackOverlay`
Rendered on top of the preview when `feedbackModeActive` is true. Captures pointer events; clicking an element triggers `SET_SELECTION_TARGETS` and shows `ActionPopover`. Provides a crosshair cursor. Selected elements receive a 2px amber outline.

#### `ActionPopover`
Floating card near the selected element. Contains:
- 👍 Like / 👎 Dislike reaction toggles.
- 💬 Comment textarea.
- ⚡ Tweak button.
- Attach, Apply Now, and Update actions.
- Calls `ChatContext.addAnnotation()` to queue feedback.

#### `SelectionBreadcrumb`
Displays the CSS selector breadcrumb path of the currently selected element.

#### `FloatingControls`
Vertically stacked floating action cluster at the bottom-right of the left panel:
- Zoom toggle.
- Feedback Mode toggle (highlighted when active).
- Open-in-new-tab button.

#### `AnnotationMarkers`
Overlays small coloured badges at annotated element positions to provide persistent visual feedback.

---

### Right Panel Components

#### `RightPanel`
Container for `ViewToggle` and the three view components.

#### `ViewToggle`
Segmented control that switches between `overall`, `finetune`, and `chat` views.

#### `ChatView`
Composed of `MessageHistory`, `AnnotationSummary`, and `ChatInput`. Reads from and writes to `ChatContext`.

#### `MessageHistory`
Scrollable list of `ChatMessage` items. Auto-scrolls to bottom on new messages.

#### `AnnotationSummary`
Conditional collapsible card showing pending annotations. Hidden when there are none.

#### `ChatInput`
Textarea + Send button at the bottom of the chat view. Calls `ChatContext.sendMessage()`.

#### `OverallStyleView`
Renders `MasterSlider` and six CSS-group accordion sections.

#### `MasterSlider`
Large horizontal slider controlling overall style intensity. Includes range anchor-point markers.

#### `ColorPaletteGroup` / `TypographyGroup` / `GeometryGroup` / `SpacingGroup` / `EffectsGroup` / `AnimationGroup`
Each group is an `Accordion` wrapping the relevant `Slider`, `ColorSwatch`, `Dropdown`, or `Toggle` controls. State changes dispatch `UPDATE_STYLE_VALUE` (committed) or `UPDATE_STYLE_VALUE_LIVE` (preview only).

#### `FineTuneView`
Shows an empty-state message when no element is selected. When an element is selected, renders `SelectionHeader` and `PropertyInspector`.

#### `SelectionHeader`
Shows the selected element's class-name chip and parent-chain breadcrumb. Multi-select shows "N elements selected".

#### `PropertyInspector`
Scrollable list of CSS property rows. Each row has a property name, current value, and an appropriate control (color picker, slider, dropdown, toggle, or segmented buttons). Includes a reset button and an "Add property" option.

---

### Footer Components

#### `Footer`
Full-width timeline bar. Renders history nodes for the active variant, undo/redo buttons, and a change count.

---

### Shared Components

#### `PanelResizer`
Thin vertical divider between the left and right panels. Handles `mousedown` → `mousemove` → `mouseup` drag logic via `usePanelResizer`. Cursor changes to `col-resize` on hover.

---

## 9. Primitive UI Components

Located in `src/primitives/`.

### `Slider`
Custom draggable slider (not `<input type="range">`). Uses a track div + thumb div with mouse-drag handling for pixel-perfect styling control.

Props: `min`, `max`, `value`, `onChange`, `label`, `unit`.

### `ColorSwatch`
A clickable colour square that opens a popover with a hex text input and a native `<input type="color">`. Supports programmatic value changes.

### `Dropdown`
Thin wrapper around a native `<select>`. Accepts `options: string[]`, `value`, and `onChange`.

### `Toggle`
An on/off switch styled as a pill. Props: `checked`, `onChange`, `label`.

### `Accordion`
Expandable section with a header (icon + label + chevron) and animated body. Uses Framer Motion for the expand/collapse animation.

### `Tooltip`
Absolute-positioned tooltip div appearing on hover with a 200ms delay. Supports `top`, `bottom`, `left`, `right` placement.

---

## 10. Hooks

### `useAppState`

```typescript
const { state, dispatch } = useAppState();
```

Returns the global `AppState` and a type-safe `dispatch` function for all `AppAction` variants. Internally uses `useReducer`.

### `useKeyboardShortcuts`

Registered via `useEffect` on the `document`. Handles:
- `Cmd/Ctrl + Z` → dispatches `UNDO`
- `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` → dispatches `REDO`

### `usePanelResizer`

```typescript
const { onMouseDown } = usePanelResizer({ dispatch, leftWidthPct });
```

Attaches `mousemove` and `mouseup` listeners on `document` during an active drag. Calculates the new panel width percentage and dispatches `SET_PANEL_WIDTH`. Enforces minimum widths for both panels.

### `useSlider`

```typescript
const { isDragging, onMouseDown } = useSlider({ min, max, value, onChange });
```

Generic draggable slider logic. Tracks pointer position, clamps values to `[min, max]`, and calls `onChange` on each update.

---

## 11. Context — ChatContext

**Provider:** Wrap the app tree (or the right-panel subtree) in `<ChatProvider>`.

**Consumer:** Call `useChatContext()` in any child component.

```typescript
const {
  messages,
  pendingAnnotations,
  currentRound,
  addAnnotation,
  removeAnnotation,
  sendMessage,
  hoveredVariantIndex,
  pendingNavigation,
  highlightedAnnotationId,
} = useChatContext();
```

### Methods

#### `addAnnotation(annotation: Annotation): void`
Adds a feedback annotation to the pending list. Called by `ActionPopover` when the user clicks 👍/👎/💬 on a selected element. The annotation appears in the `AnnotationSummary` and is bundled with the next `sendMessage()` call.

#### `removeAnnotation(id: string): void`
Removes a pending annotation by ID. Called from the × button on individual annotation items in `AnnotationSummary`.

#### `sendMessage(text: string): void`
Bundles `text` and all `pendingAnnotations` into a `ChatMessage`, appends it to `messages`, clears `pendingAnnotations`, increments `currentRound`, and (currently) appends a mock assistant response. Future: will compile a structured prompt and call the real LLM API.

---

## 12. Manifest Rendering Engine API

Located in `src/api/manifestRenderingEng/`. Pure JavaScript modules with zero external dependencies. Import everything from the unified entry point:

```javascript
import {
  validateManifest, createManifest, cloneManifest,
  getAvailableCases, getLayoutsForCase, getRootClass,
  registerCase, CASE_REGISTRY,
  scopeCSS, unscopeCSS,
  applyCSSPatch, extractSelectors, extractProperties, extractSectionLabels,
  jsonPointer,
  applyPatch, applyBatch, PatchEngine,
  validatePatch, serializePatches, deserializePatches,
  getPreset, listPresets, getAllPresets, registerPreset,
  manifestRender, manifestRenderOne, renderToHTML, renderToFullHTML,
} from './manifestRenderingEng/index.js';
```

### Manifest Schema (`manifest-schema.js`)

A **manifest** is the single source of truth: `{ meta, content, layout, css }`.

```typescript
interface Manifest {
  meta: {
    case: string;          // e.g. "academic-homepage"
    contentPreset: string; // e.g. "default", "senior-professor"
    description: string;
  };
  content: object;         // case-specific content data
  layout: string;          // one of the valid layouts for this case
  css: string;             // raw CSS string
}
```

Key functions:

| Function | Description |
|---|---|
| `validateManifest(m)` | Returns `{ valid, errors[] }`. Never throws. |
| `createManifest({ caseName, preset?, content, layout?, css?, description? })` | Factory with defaults. Throws on unknown case/layout. |
| `cloneManifest(m)` | Deep clone via JSON serialization. |
| `getAvailableCases()` | Returns `["academic-homepage", "ecommerce-showcase"]`. |
| `getLayoutsForCase(caseName)` | Returns layout IDs for the given case. |
| `getRootClass(caseName)` | Returns the root CSS class (e.g. `"academic-page"`). |
| `registerCase(caseName, { layouts, rootClass })` | Register a custom case at runtime. |

---

### JSON Pointer (`json-pointer.js`)

RFC 6901 implementation for navigating nested objects. Path syntax: `"/content/name"`, `"/content/skills/3"`, `"/content/publications/-"` (append to array).

| Function | Description |
|---|---|
| `jsonPointer.parse(pointer)` | Parses a pointer string into a token array. |
| `jsonPointer.compile(tokens)` | Compiles a token array back to a pointer string. |
| `jsonPointer.get(obj, pointer)` | Read a value; returns `undefined` if not found. |
| `jsonPointer.set(obj, pointer, value)` | Mutates in-place; creates intermediates; `-` appends to arrays. Returns previous value. |
| `jsonPointer.remove(obj, pointer)` | Mutates in-place; splices arrays cleanly. Returns removed value. |
| `jsonPointer.has(obj, pointer)` | Returns `true` if the path exists. |

---

### CSS Scoper (`css-scoper.js`)

Scopes CSS selectors to a unique wrapper ID so multiple variants can coexist on one page without conflicts.

| Function | Description |
|---|---|
| `scopeCSS(css, scopeId)` | Prefixes every selector with `#scopeId`. Handles `@keyframes`, `@media`, `@supports`, `@font-face`, `@import`, etc. |
| `unscopeCSS(scopedCSS, scopeId)` | Strips all `#scopeId` prefixes. Useful for clean CSS export. |

---

### CSS Patcher (`css-patcher.js`)

Surgical string-level edits to CSS without a full parse/serialize cycle.

| Function | Description |
|---|---|
| `applyCSSPatch(css, patch)` | Applies one patch. Patch shapes: `{ selector, property, value }`, `{ action: 'append' \| 'prepend' \| 'remove-rule' \| 'replace-block' \| 'upsert', ... }`. |
| `extractSelectors(css)` | Returns all unique selectors found in the CSS string. |
| `extractProperties(css, selector)` | Returns `{ property: value }` map for a specific selector block. |
| `extractSectionLabels(css)` | Extracts semantic labels from `/* [label] */` CSS comments. |

---

### Patch Engine (`patch-engine.js`)

Core mutation engine. Supports RFC 6902 JSON Patch operations plus a custom `"css"` op.

#### Patch format

```typescript
interface Patch {
  op: 'replace' | 'add' | 'remove' | 'move' | 'copy' | 'css';
  path?: string;      // JSON Pointer; required for JSON ops
  value?: any;        // required for replace, add
  from?: string;      // required for move, copy
  selector?: string;  // for css op
  property?: string;  // for css op
  action?: string;    // append | prepend | remove-rule | replace-block | upsert
  rule?: string;      // for append/prepend
  source?: string;    // "llm" | "user" | "tween"
  timestamp?: number; // auto-set by PatchEngine.apply()
}
```

#### Stateless functions

| Function | Description |
|---|---|
| `applyPatch(manifest, patch)` | Returns `{ result: Manifest, inverse: Patch }`. Immutable. |
| `applyBatch(manifest, patches[])` | Applies sequentially. Returns `{ result, inverses[] }`. |
| `validatePatch(manifest, patch)` | Returns `{ valid, errors[] }`. Does not apply. |
| `serializePatches(patches)` | `JSON.stringify` with indentation. |
| `deserializePatches(json)` | `JSON.parse` with array validation. |

#### `PatchEngine` class (stateful)

```javascript
const engine = new PatchEngine();
```

| Method / Property | Description |
|---|---|
| `engine.apply(manifest, patch)` | Applies patch, records history, clears redo stack. |
| `engine.applyBatch(manifest, patches)` | Applies multiple patches, each with its own history entry. |
| `engine.undo(manifest)` | Reverts last patch; moves to redo stack. |
| `engine.redo(manifest)` | Re-applies last undone patch. |
| `engine.undoN(manifest, n)` | Undo N patches at once. |
| `engine.getHistory()` | Returns copy of all applied patches. |
| `engine.canUndo` | Boolean. |
| `engine.canRedo` | Boolean. |
| `engine.historyLength` | Number of applied patches. |
| `engine.clearHistory()` | Wipes all history and stacks. |
| `PatchEngine.squash(original, current)` | Static. Produces a minimal patch set to transform `original` into `current`. |

---

### Content Presets (`content-presets.js`)

Ten complete content presets (five per case) ready to drop into a manifest.

| Case | Presets |
|---|---|
| `academic-homepage` | `default`, `senior-professor`, `industry-researcher`, `early-career`, `interdisciplinary` |
| `ecommerce-showcase` | `default`, `tech-gadgets`, `fashion`, `food-artisan`, `digital-goods` |

| Function | Description |
|---|---|
| `getPreset(caseName, presetName?)` | Returns a deep clone of the content object. Default: `"default"`. |
| `listPresets(caseName)` | Returns preset names for a case. |
| `getAllPresets()` | Returns the entire preset registry as a deep clone. |
| `registerPreset(caseName, presetName, content)` | Add a custom preset at runtime. |

---

### Manifest Render (`manifest-render.js`)

Framework-agnostic rendering pipeline. Takes manifest(s) and produces `RenderDescriptor` objects.

```typescript
interface RenderDescriptor {
  scopeId: string;       // unique scope ID (e.g. "page-academic-homepage-0-abc")
  manifest: Manifest;
  caseName: string;
  layout: string;
  rootClass: string;     // e.g. "academic-page"
  layoutClass: string;   // e.g. "layout-sidebar-left"
  scopedCSS: string;     // CSS with selectors prefixed by #scopeId
  content: object;
  skeletonKey: string;   // e.g. "academic-homepage/sidebar-left"
}
```

| Function | Description |
|---|---|
| `manifestRender(manifests, interpreter?)` | Accepts one or more manifests. Returns a `RenderDescriptor[]`. |
| `manifestRenderOne(manifest, interpreter?)` | Convenience wrapper returning a single descriptor. |
| `renderToHTML(descriptor, htmlRenderer)` | Produces an HTML fragment string. |
| `renderToFullHTML(descriptor, htmlRenderer, options?)` | Produces a complete `<!DOCTYPE html>` page with Google Fonts link and optional CSS reset. |

---

## 13. Type Reference

All types are exported from `src/types/index.ts`.

### `Variant`
```typescript
interface Variant {
  id: string;
  label: string;       // e.g. "V1"
  color: string;       // background hex
  accent: string;      // accent hex
  style: string;       // style label e.g. "Neon Grid"
  annotation?: 'like' | 'dislike';
}
```

### `HistoryNode`
```typescript
interface HistoryNode {
  id: number;
  type: 'llm' | 'user';
  summary: string;
  timestamp: number;
}
```

### `AnnotatedElement`
```typescript
interface AnnotatedElement {
  selector: string;
  elementRef: HTMLElement;  // live DOM reference
  reaction?: 'like' | 'dislike';
  comment?: string;
}
```

### `StyleValues`
Holds the full set of style controls for one variant (23 properties):
- `masterIntensity: number`
- Color: `bgColor`, `textColor`, `accentPrimary`, `accentSecondary`, `contrast`
- Typography: `headingFont`, `bodyFont`, `baseSize`, `lineHeight`
- Geometry: `borderRadius`, `uniformRadius`
- Spacing: `density`, `sectionGap`
- Effects: `shadowIntensity`, `hoverLift`, `backdropBlur`
- Animation: `transitionSpeed`, `entranceAnimations`, `hoverAnimations`

### `SelectionTarget`
```typescript
interface SelectionTarget {
  scopeId: string;
  variantIndex: number;
  contentPath: string | null;  // JSON Pointer from data-content-path attribute
  cssSelector: string | null;
  level: 'page' | 'section' | 'element' | 'text';
  label: string;
  elementRef: HTMLElement;     // runtime-only, not serialized
}
```

### `Annotation`
```typescript
interface Annotation {
  id: string;
  variantIndex: number;
  target: SelectionTarget;
  type: 'like' | 'dislike' | 'comment' | 'tweak';
  comment?: string;
  immediate?: boolean;  // true = Apply Now; dispatch without waiting for sendMessage()
}
```

### `ChatMessage`
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  annotations?: Annotation[];  // user messages only
  roundNumber?: number;        // assistant messages only
  variantCount?: number;       // assistant messages only
  timestamp: number;
}
```

### `ContentPreset`
```typescript
interface ContentPreset {
  caseName: 'academic-homepage';
  presetName: string;
  label: string;
}
```

---

## 14. Design System

### Colors (Tailwind custom tokens)

| Token | Value | Usage |
|---|---|---|
| `panel-bg` | `#f5f7fa` | Panel background |
| `panel-surface` | `#ffffff` | Cards, popovers |
| `panel-border` | `#e8ecf0` | Dividers, borders |
| `panel-muted` | `#8c8c8c` | Secondary text |
| `accent` | `#1677ff` | Primary actions, active states |
| `accent-hover` | `#0958d9` | Accent hover state |
| `preview-bg` | `#f0f2f5` | Preview area background |

### Typography

| Role | Font | Fallback |
|---|---|---|
| UI text / labels | DM Sans | system-ui |
| Code / class names / values | JetBrains Mono | Fira Code |

### Custom Tailwind Utilities

| Class | Effect |
|---|---|
| `.scrollbar-thin` | 8px wide, auto-hide, rounded, muted-track scrollbar |
| `.scrollbar-none` | Hidden scrollbar |
| `.scroll-fade-x` | Horizontal fade mask at edges |
| `.font-code` | Applies monospace font family |

### Spacing & Motion

- **Base grid:** 8px.
- **Transition speed:** 150ms default for all UI transitions.
- **Slider drag:** Targets 60fps smooth drag via direct DOM mouse-tracking (no throttle).
- **Accordion animation:** Framer Motion height/opacity transition.
- **Panel resize:** `mousemove` directly on `document` for responsive tracking.

### Visual Direction

The tool's aesthetic is professional and tool-oriented — "VS Code meets Figma":
- Subtle 1px borders in muted colours; no heavy dividers.
- Minimal shadows (only popovers, tooltips, header).
- Monospace font for class names and CSS values; sans-serif for all other labels.
- A single strong accent colour (#1677ff) used sparingly for active states and primary actions.

---

## 15. Mock Data

### Six Default Variants (`src/data/mockData.ts`)

```typescript
const mockVariants = [
  { id: 'v1', label: 'V1', color: '#0a0e1a', accent: '#00d4ff', style: 'Neon Grid' },
  { id: 'v2', label: 'V2', color: '#1a0a2e', accent: '#b44aff', style: 'Holographic' },
  { id: 'v3', label: 'V3', color: '#faf8f5', accent: '#8b6f5a', style: 'Warm Paper' },
  { id: 'v4', label: 'V4', color: '#000000', accent: '#00ff00', style: 'Terminal' },
  { id: 'v5', label: 'V5', color: '#f0f4f8', accent: '#3b82f6', style: 'Clean Blue' },
  { id: 'v6', label: 'V6', color: '#1a1a1a', accent: '#e5484d', style: 'Dark Red' },
];
```

### Mock History Nodes

Seven history entries per variant representing an initial LLM generation, several style patches, and user edits (types: `'llm'` and `'user'`).

### Mock Annotations (ChatContext)

Three hardcoded annotations used for visual testing until `ActionPopover` integration is complete. All are wrapped in `// ====== MOCK DATA — DELETE WHEN REAL DATA IS AVAILABLE ======` comments.

### Font Lists

**Heading fonts:** Space Grotesk, Playfair Display, DM Serif Display, Outfit, Sora.
**Body fonts:** DM Sans, Work Sans, IBM Plex Sans, Crimson Pro.

---

## 16. Feature Status & Roadmap

### Implemented (UI Shell)

- Multi-layout preview system (5 academic homepage layouts).
- Header preset selector (5 academic personas).
- Resizable left/right panels via drag.
- Feedback mode with click-to-select element overlay.
- `ActionPopover` with like/dislike/comment/tweak actions.
- `AnnotationMarkers` overlaying badges on annotated elements.
- `SelectionBreadcrumb` showing element DOM path.
- Chat tab with message history, annotation summary, and send input.
- Overall style controls — master slider + 6 CSS-group accordion sections.
- Fine-tune property inspector (per-element CSS editing).
- Undo/redo history per variant (timeline nodes in footer).
- Keyboard shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Y / Cmd/Ctrl+Shift+Z.
- Smooth animations (Framer Motion throughout).
- Custom primitive components (Slider, ColorSwatch, Dropdown, Toggle, Accordion, Tooltip).
- Manifest rendering engine (pure JS, no external dependencies).

### Not Yet Implemented (Pending Backend Integration)

- **LLM API integration** — `sendMessage()` in `ChatContext` currently appends a mock response. Replace with a real API call that accepts `{ text, pendingAnnotations, currentManifests }` and returns new manifests.
- **Variant generation** — `GENERATE_VARIANTS` dispatch currently returns empty. Wire to LLM to produce 4–8 real manifests.
- **Real manifest CSS generation** — Currently uses static mock CSS. LLM output should populate `manifest.css`.
- **"Generate More Variants"** — The `+ More` thumbnail card dispatches `GENERATE_MORE_VARIANTS` but takes no real action.
- **"Apply Now" in ActionPopover** — `immediate: true` annotations are stored but not yet acted upon without a `sendMessage()` call.
- **Code export** — The Export button in the header has no implementation. Should call `renderToFullHTML()` and trigger a download.
- **Aggregate Feedback** — Button in header is present but not wired.
- **CSS patch live-update in preview** — Style control changes currently console-log the patch; they should update the manifest CSS via `PatchEngine` and re-render.

---

*Documentation generated from source — March 2026.*
