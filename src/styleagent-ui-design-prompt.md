# StyleAgent — UI Shell Design Prompt

## Context

You are building the frontend UI shell for **StyleAgent**, an LLM-powered web style design tool. The tool lets users describe a visual style in natural language (e.g. "futuristic", "warm and cozy", "Morandi color palette"), then the LLM generates multiple live-preview webpage variants. Users can browse, select, annotate (like/dislike), comment, and fine-tune these variants through both high-level style controls and per-element CSS adjustments.

**This prompt is for the UI shell only** — all panels, layouts, interactions, and placeholder states. No backend integration, no LLM calls, no real rendering engine. Use mock data and placeholder components throughout.

---

## Tech Stack

- React 18+ with TypeScript
- Tailwind CSS for utility styling
- Lucide React for icons
- Framer Motion for animations
- No external component libraries (build all components from scratch)
- Vite as bundler

---

## Overall Layout Architecture

The application is a single-page layout with 4 zones:

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER — Variant Thumbnail Strip                            │
├───────────────────────────────┬─┬────────────────────────────┤
│                               │R│                            │
│                               │E│                            │
│   LEFT PANEL                  │S│   RIGHT PANEL              │
│   Live Preview                │I│   Style Controls           │
│                               │Z│                            │
│                               │E│                            │
│                               │R│                            │
├───────────────────────────────┴─┴────────────────────────────┤
│  FOOTER — Patch History Timeline                             │
└──────────────────────────────────────────────────────────────┘
```

The RESIZER is a draggable vertical divider between left and right panels. The user drags it to adjust the width ratio. Default split: 60% left / 40% right. Min left width: 400px. Min right width: 320px.

---

## Zone 1: HEADER — Variant Thumbnail Strip

A horizontal scrollable strip of miniature variant thumbnails pinned to the top of the viewport.

### Layout

- Full viewport width, fixed height: 72px (including 1px bottom border).
- **Left region** (fixed, ~260px): the prompt input area.
  - A compact text input showing the current style prompt (e.g. "futuristic"). 
  - An "Enter" / send icon button to submit.
  - When empty, placeholder text: "Describe a style..."
- **Center region** (flexible, scrollable): the thumbnail strip.
  - Horizontal row of variant thumbnail cards.
  - Scroll with mouse wheel (horizontal scroll) or drag. Show subtle left/right fade gradients when overflowing.
  - Each thumbnail card:
    - Fixed size: 80px × 48px, rounded-sm (4px radius).
    - Shows a scaled-down representation of the variant (for now, use a colored rectangle with a variant label like "V1", "V2", etc.).
    - Border: 1.5px solid transparent by default. The **currently selected** variant has an accent-colored border + subtle glow.
    - On hover: slight scale-up (1.05) and border color change.
    - On click: selects this variant → left panel shows it, right panel shows its controls, footer shows its history.
    - Below each thumbnail: a tiny label "V1", "V2", etc. (10px font, muted color).
    - A small ❤️/👎 icon overlay in the top-right corner if the user has annotated this variant (like or dislike). Only visible on hover or if annotated.
  - At the end of the strip: a "+ More" button card (same size as thumbnails, dashed border, muted). Clicking it would trigger the LLM to generate more variants (just show a tooltip "Generate more variants" for now).
- **Right region** (fixed, ~120px): action buttons.
  - "Aggregate Feedback" button (small, outlined). Tooltip: "Collect all annotations across variants and generate new ones."
  - "Export" icon button. Tooltip: "Download source code."

### Visual Style

- Background: slightly elevated from the main content (e.g. white or very light gray, with a subtle bottom shadow).
- The strip should feel like a filmstrip / timeline scrubber — compact, information-dense, but not cluttered.
- Smooth horizontal scroll with momentum.

---

## Zone 2: LEFT PANEL — Live Preview

The main preview area showing the currently selected variant at full fidelity.

### Default State (no variant selected)

- Center a prompt: large text "Describe a style to begin" with a larger input field and submit button. This is the onboarding/empty state.

### Preview State

- The variant's live webpage preview fills this panel.
- For the UI shell, render a **placeholder webpage mockup** — a simple academic homepage skeleton with colored sections (header, nav, bio, stats, publications, etc.) using the class names from the manifest spec. Style it with a sample CSS theme so it looks like a real preview.
- **Live Feedback Mode overlay** (toggled by a floating button in the bottom-right corner of this panel):
  - When active, a semi-transparent overlay appears on the preview.
  - Users can click on individual elements in the preview to **select** them. Selected elements get a colored outline (e.g. 2px dashed accent color) and a small floating badge showing the element's class name (e.g. ".nav-bar", ".pub-card").
  - Multiple elements can be selected simultaneously.
  - For each selected element, a small floating pill appears near it with:
    - 👍 / 👎 toggle buttons
    - A tiny comment icon that opens an inline comment input
  - At the bottom of the overlay, a **feedback summary bar** appears:
    - Shows count: "3 elements selected"
    - A text input for a unified comment across all selected elements
    - A "Send to LLM" button (accent color)
    - A "Clear selection" text button

### Floating Controls (bottom-right of left panel, above footer)

- A floating action button cluster (vertical, stacked):
  - 🔍 **Zoom** — toggle between "Fit to panel" and "100% scale" (scrollable).
  - 💬 **Feedback Mode** — toggle Live Feedback Mode on/off. When active, this button is highlighted.
  - ↗️ **Open in new tab** — tooltip: "Open full-screen preview"

---

## Zone 3: RIGHT PANEL — Style Controls

This panel has **two views**, toggled by a segmented control at the top:

```
┌─────────────────────────────────┐
│  [  Overall Style  |  Fine-Tune ]  ← segmented toggle
├─────────────────────────────────┤
│                                 │
│  (view content here)            │
│                                 │
└─────────────────────────────────┘
```

### View A: "Overall Style" (Global style adjustments)

This view lets users control the **overall feel** of the style through a single "master slider" concept.

#### Master Slider Section

- **Master Slider**: A large horizontal slider at the top of this view.
  - Label above it: the user's style prompt in quotes (e.g. `"futuristic"`).
  - The slider controls "how much" of that style is applied. Left = less, Right = more.
  - Range: conceptual, no numeric display. Just a smooth gradient track.
  - **Anchor points**: Two small draggable markers at each end of the slider track that define the slider's effective range. Users can narrow the range. These are subtle — small triangles or diamonds above the track.
  - Below the slider: "Less ← → More" labels in muted text.
  - Changes to this slider visually update the left panel preview in real-time (for now, just log to console).

#### CSS Group Sections (expandable)

Below the master slider, show expandable accordion sections for each CSS semantic group. Each section represents a cluster of related CSS properties.

For the mock, include these groups:

1. **Color Palette** — icon: 🎨
   - Description: "Background, text, and accent colors"
   - When expanded, shows:
     - Color swatch pairs (background ↔ text, accent primary ↔ secondary)
     - Each swatch is clickable → opens a color picker popover
     - A mini-slider labeled "Contrast" controlling the overall contrast ratio

2. **Typography** — icon: Aa
   - Description: "Font families, sizes, and weights"
   - When expanded, shows:
     - Dropdown: "Heading font" (mock options: Space Grotesk, Playfair Display, DM Serif Display, Outfit, Sora)
     - Dropdown: "Body font" (mock options: DM Sans, Work Sans, IBM Plex Sans, Crimson Pro)
     - Slider: "Base size" (12px – 20px)
     - Slider: "Line height" (1.2 – 2.0)

3. **Geometry** — icon: ◻️
   - Description: "Border radius, corners, and shapes"
   - When expanded, shows:
     - Slider: "Border radius" (0px – 24px) with a preview showing a small rounded rectangle updating live
     - Toggle: "Uniform radius" (on/off)

4. **Spacing** — icon: ↔️
   - Description: "Margins, padding, and gaps"
   - When expanded, shows:
     - Slider: "Density" (compact ↔ spacious)
     - Slider: "Section gap" (16px – 64px)

5. **Effects** — icon: ✨
   - Description: "Shadows, blurs, and hover effects"
   - When expanded, shows:
     - Slider: "Shadow intensity" (none – strong)
     - Slider: "Hover lift" (0px – 8px translateY)
     - Toggle: "Backdrop blur" (on/off)

6. **Animation** — icon: 🎬
   - Description: "Transitions and keyframe animations"
   - When expanded, shows:
     - Slider: "Transition speed" (0ms – 500ms)
     - Toggle: "Entrance animations" (on/off)
     - Toggle: "Hover animations" (on/off)

#### Group Behavior

- Each group header shows: icon, name, description, and a collapse/expand chevron.
- When a group is expanded, the CSS group name is used to **highlight the affected elements** in the left panel preview (for now, just add a subtle highlight outline class).
- Each slider/control within a group updates the preview in real-time when dragged.
- Changes from these controls emit patches to the PatchEngine (for now, just console.log the patch object).

---

### View B: "Fine-Tune" (Element-specific adjustments)

This view lets users select individual elements and tweak their specific CSS properties.

#### Empty State

- When no element is selected in the preview: show a centered message with an illustration — "Click an element in the preview to fine-tune it" with a pointer-click icon.

#### Element Selected State

When the user has selected element(s) in the live preview:

- **Selection header**: 
  - If single element: Show the element's class name as a chip/tag (e.g. `.pub-card`) and a breadcrumb of its parent chain (e.g. `.academic-page > .pub-section > .pub-card`).
  - If multiple elements: Show "3 elements selected" with chips for each class name. Below that, note: "Showing shared properties only."

- **Property Inspector** (scrollable list of editable properties):
  - Organized by CSS category (same groups as Overall Style, but only showing properties that apply to the selected element).
  - Each property row:
    - Property name (e.g. `color`, `font-size`, `border-radius`)
    - Current value display
    - An appropriate control:
      - Color properties → color swatch + picker
      - Size properties (px, rem, em) → slider + number input
      - Font properties → dropdown
      - Boolean-ish properties (e.g. `display: none` vs `block`) → toggle
      - Enum properties (e.g. `text-align`) → segmented buttons
    - A "reset" icon button (↩️) to revert to the value before user edits.
  - At the bottom: "Add property" button to add any CSS property manually (opens a searchable property name dropdown + value input).

- **Multiple element behavior**:
  - When multiple elements are selected, only show properties that ALL selected elements have in common.
  - Values that differ across elements show as "mixed" with a dash indicator.
  - Adjusting a "mixed" property applies the new value to all selected elements.

---

## Zone 4: FOOTER — Patch History Timeline

A compact horizontal timeline showing the history of all patches applied to the currently selected variant.

### Layout

- Full viewport width, fixed height: 48px (including 1px top border).
- **Left label** (fixed, ~80px): "History" text, muted.
- **Timeline track** (flexible, scrollable): A horizontal track with nodes.
  - Each node is a small circle (8px diameter) on the track.
  - Nodes are connected by a thin line.
  - Node color:
    - Blue: LLM-generated patch
    - Green: User patch
    - Gray: undone patch (still in redo stack)
  - On hover over a node: a tooltip showing the patch summary (e.g. "Changed .name color to #ff6b9d" or "LLM: applied 4 style patches").
  - The **current state** node is slightly larger (10px) and has a ring/glow.
  - Clicking a node **undoes/redoes to that point** (jumps to that state).
  - Nodes to the right of the current state (redo stack) are grayed out.
- **Right controls** (fixed, ~160px):
  - Undo button (←) with keyboard shortcut hint "⌘Z"
  - Redo button (→) with keyboard shortcut hint "⌘⇧Z"
  - A tiny text showing "12 changes" (count of patches in history)

### Visual Style

- Minimal, IDE-like. Feels like a Git commit graph compressed into one line.
- Subtle animation when new nodes are added (pop-in).
- Auto-scroll to keep the current-state node visible.

---

## Interaction Flow Summary

1. **Start**: User sees empty state. Types a style prompt in the header input (or the large center input).
2. **Generation**: After submitting, the header thumbnail strip populates with 4–8 variant thumbnails (animate in from right, staggered). The first variant is auto-selected.
3. **Browse**: User clicks thumbnails to switch between variants. Left panel updates, right panel resets to that variant's state, footer shows that variant's history.
4. **Annotate**: User toggles Feedback Mode, clicks elements in the preview, adds 👍/👎 and comments. These annotations are stored per-variant.
5. **Fine-tune**: User switches right panel to "Fine-Tune", clicks an element in preview, adjusts specific properties via sliders/pickers. Each adjustment is a patch → appears as a new node in the footer timeline.
6. **Overall Style**: User switches right panel to "Overall Style", drags the master slider or adjusts CSS group controls. Each adjustment is a patch.
7. **Undo**: User clicks a history node in the footer, or presses ⌘Z. The preview reverts.
8. **More variants**: User clicks "+ More" in the thumbnail strip → new thumbnails appear.
9. **Aggregate feedback**: User clicks "Aggregate Feedback" → system collects all annotations across all variants → ready to send to LLM for next-generation variants.
10. **Export**: User clicks Export → downloads the current variant's HTML/CSS.

---

## Mock Data

For the UI shell, include this mock data:

### Variants (6 mock variants)

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

### History Nodes (mock for selected variant)

```typescript
const mockHistory = [
  { id: 1, type: 'llm', summary: 'Initial generation', timestamp: Date.now() - 60000 },
  { id: 2, type: 'llm', summary: 'Applied 6 CSS group patches', timestamp: Date.now() - 50000 },
  { id: 3, type: 'user', summary: 'Changed .name color to #ff6b9d', timestamp: Date.now() - 30000 },
  { id: 4, type: 'user', summary: 'Set border-radius to 12px', timestamp: Date.now() - 20000 },
  { id: 5, type: 'user', summary: 'Switched layout to sidebar-left', timestamp: Date.now() - 10000 },
  { id: 6, type: 'llm', summary: 'LLM: made style more playful', timestamp: Date.now() - 5000 },
  { id: 7, type: 'user', summary: 'Adjusted font-size to 16px', timestamp: Date.now() },
];
```

### Mock Preview Content

Use the academic homepage default preset content (Alex Chen, PhD student, 3 publications, etc.) rendered as a simple styled skeleton in the left panel.

---

## Visual Design Direction

The tool itself should have a **professional, tool-oriented** aesthetic — not flashy, not boring.

- **Theme**: Dark sidebar/panels with a light or neutral preview area. Think VS Code meets Figma.
- **Accent color**: A single strong accent (e.g. electric blue #3b82f6 or indigo #6366f1) used sparingly for active states, selected items, and primary actions.
- **Typography**: Monospace for class names, property names, and values. Sans-serif (system or DM Sans) for labels and UI text.
- **Borders**: Subtle 1px borders in muted colors. No heavy dividers.
- **Shadows**: Minimal. Only on popovers, tooltips, and the header.
- **Spacing**: Dense but breathable. 8px base grid. The tool should feel efficient, not wasteful.
- **Animations**: Fast and purposeful. 150ms transitions. No gratuitous motion. Slider drags should feel 60fps smooth.
- **Scrollbars**: Thin, auto-hide, custom styled (8px wide, rounded, muted track).

---

## Component Hierarchy (for code organization)

```
App
├── Header
│   ├── PromptInput
│   ├── VariantThumbnailStrip
│   │   ├── VariantThumbnail (×N)
│   │   └── GenerateMoreButton
│   └── HeaderActions (AggregateFeedback, Export)
│
├── MainArea
│   ├── LeftPanel (LivePreview)
│   │   ├── PreviewFrame
│   │   │   └── MockAcademicPage (placeholder skeleton)
│   │   ├── FeedbackOverlay (conditional)
│   │   │   ├── ElementSelector (click handler)
│   │   │   ├── ElementAnnotationPill (×N per selected)
│   │   │   └── FeedbackSummaryBar
│   │   └── FloatingControls (Zoom, Feedback toggle, Open)
│   │
│   ├── PanelResizer (draggable divider)
│   │
│   └── RightPanel
│       ├── ViewToggle (segmented: Overall | Fine-Tune)
│       ├── OverallStyleView (conditional)
│       │   ├── MasterSlider
│       │   └── CSSGroupAccordion (×6)
│       │       ├── ColorPaletteGroup
│       │       ├── TypographyGroup
│       │       ├── GeometryGroup
│       │       ├── SpacingGroup
│       │       ├── EffectsGroup
│       │       └── AnimationGroup
│       └── FineTuneView (conditional)
│           ├── EmptyState
│           ├── SelectionHeader
│           └── PropertyInspector
│               └── PropertyRow (×N)
│
└── Footer
    ├── HistoryLabel
    ├── HistoryTimeline
    │   └── HistoryNode (×N)
    └── HistoryControls (Undo, Redo, Count)
```

---

## Implementation Notes

- All state management via React useState/useReducer. No Redux or Zustand needed for the shell.
- The PanelResizer should use `onMouseDown` → `onMouseMove` → `onMouseUp` pattern with `cursor: col-resize`.
- The VariantThumbnailStrip should use `overflow-x: auto` with `scroll-behavior: smooth` and `-webkit-overflow-scrolling: touch`.
- The History Timeline nodes should be positioned along a horizontal flex track with `position: relative` dots connected by a `::before` pseudo-element line.
- Keyboard shortcuts: ⌘Z for undo, ⌘⇧Z for redo (register via `useEffect` + `keydown` listener).
- All sliders should use a custom Slider component (not `<input type="range">`). Use a track div + thumb div with drag handling for pixel-perfect control over styling.
- Color pickers: build a simple popover with a hue bar + saturation/lightness square, or use a hex input. No need for a full-featured picker — just enough to look real.
- Tooltips: simple absolute-positioned divs that appear on hover with a 200ms delay.
- The left panel preview content does NOT need to be interactive in this shell. It's a static visual mockup of an academic homepage. But it should look like a real webpage preview — use actual HTML structure with the manifest class names (.academic-page, .nav-bar, .header, .name, .pub-card, etc.) and style it with a sample dark theme CSS.
- The feedback overlay's element selection should work: clicking on elements in the preview toggles their selection state (adds/removes dashed outline). This is real interactivity that should be implemented.

---

## What NOT to Build

- No actual LLM API calls
- No actual PatchEngine integration (just console.log mock patches)
- No actual CSS scoping or manifest rendering
- No actual code export functionality
- No actual responsive/mobile layout (desktop only, min-width 1200px)
- No authentication or user accounts
- No file upload (Workflow Start 2 with screenshots is out of scope)
