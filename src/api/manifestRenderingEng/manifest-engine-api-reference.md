# @manifest/engine — API Reference

## Overview

```
Import everything from the unified entry point:

  import { createManifest, PatchEngine, scopeCSS, ... } from './manifest-engine/index.js';
```

7 core modules, zero external dependencies. All functions are pure (no side effects) unless noted.

---

## 1. manifest-schema

Validates, creates, and manages manifest objects. A manifest is the single source of truth: `{ meta, content, layout, css }`.

### Manifest Shape

```typescript
interface Manifest {
  meta: {
    case: string;            // "academic-homepage" | "ecommerce-showcase"
    contentPreset: string;   // "default", "senior-professor", etc.
    description: string;
  };
  content: object;           // case-specific content data
  layout: string;            // one of 5 layouts per case
  css: string;               // raw CSS string (full creative freedom)
}
```

### Functions

#### `validateManifest(manifest) → { valid: boolean, errors: string[] }`

Checks that a manifest has correct structure, known case, valid layout for that case, and css is a string. Never throws.

```javascript
const { valid, errors } = validateManifest(myManifest);
if (!valid) console.error(errors);
```

#### `createManifest({ caseName, preset?, content, layout?, css?, description? }) → Manifest`

Factory that produces a well-formed manifest. Defaults: `preset = "default"`, `layout = first layout for case`, `css = ""`.

```javascript
const manifest = createManifest({
  caseName: 'academic-homepage',
  content: { name: 'Alex' },
  layout: 'sidebar-left',
  css: '.name { color: blue; }',
});
```

Throws if `caseName` is unknown or `layout` is invalid for the case.

#### `cloneManifest(manifest) → Manifest`

Deep clone via JSON serialization. Safe to mutate the result.

#### `getAvailableCases() → string[]`

Returns `["academic-homepage", "ecommerce-showcase"]` (plus any runtime-registered cases).

#### `getLayoutsForCase(caseName) → string[]`

```javascript
getLayoutsForCase('academic-homepage')
// → ["classic", "sidebar-left", "sidebar-right", "hero-banner", "compact"]
```

Returns `[]` for unknown cases.

#### `getRootClass(caseName) → string | null`

```javascript
getRootClass('academic-homepage')   // → "academic-page"
getRootClass('ecommerce-showcase')  // → "ecommerce-page"
```

#### `registerCase(caseName, { layouts, rootClass }) → void`

Register a new case type at runtime. Throws if already registered.

```javascript
registerCase('blog-post', {
  layouts: ['single-column', 'magazine'],
  rootClass: 'blog-page',
});
```

#### `CASE_REGISTRY`

Direct access to the internal registry object. Read-only usage recommended.

---

## 2. json-pointer

RFC 6901 implementation for navigating and mutating nested objects by path string. Foundation for PatchEngine.

Path syntax: `"/content/name"`, `"/content/skills/3"`, `"/content/publications/-"` (append).

### Functions

#### `parse(pointer) → string[]`

```javascript
parse('/content/name')       // → ["content", "name"]
parse('/a~1b')               // → ["a/b"]  (~ escaping)
parse('')                    // → []
```

Throws if pointer doesn't start with `/` (unless empty).

#### `compile(tokens) → string`

```javascript
compile(["content", "name"])  // → "/content/name"
```

Inverse of `parse`. Roundtrips correctly.

#### `get(obj, pointer) → any`

```javascript
const obj = { content: { skills: ["Python", "React"] } };
get(obj, '/content/skills/1')  // → "React"
get(obj, '/nonexistent/path')  // → undefined (no throw)
```

Accepts either a string pointer or a pre-parsed token array.

#### `set(obj, pointer, value) → previousValue`

Mutates `obj` in-place. Creates intermediate objects/arrays as needed. The `"-"` token appends to arrays.

```javascript
const obj = {};
set(obj, '/a/b/c', 42);        // obj = { a: { b: { c: 42 } } }

const arr = { items: [1, 2] };
set(arr, '/items/-', 3);        // arr = { items: [1, 2, 3] }
```

Returns the previous value at that path, or `undefined`.

#### `remove(obj, pointer) → removedValue`

Mutates `obj` in-place. For arrays, splices the element out (no holes).

```javascript
const obj = { items: ["a", "b", "c"] };
remove(obj, '/items/1');        // returns "b", obj.items = ["a", "c"]
```

Throws if path not found or index out of bounds.

#### `has(obj, pointer) → boolean`

```javascript
has({ a: { b: 0 } }, '/a/b')   // → true
has({ a: { b: 0 } }, '/a/c')   // → false
```

---

## 3. css-scoper

Scopes a raw CSS string to a unique wrapper ID so multiple variants can coexist on one page without style conflicts.

### Functions

#### `scopeCSS(css, scopeId) → string`

Prefixes every CSS selector with `#scopeId`. Correctly handles:
- Regular selectors, comma-separated selectors
- `@keyframes` — internals (from/to/%) left unscoped
- `@media`, `@supports`, `@container` — recurses into the block
- `@font-face`, `@import`, `@charset` — passed through unchanged
- CSS comments — preserved

```javascript
scopeCSS('.name { color: red; }', 'page-1')
// → "#page-1 .name { color: red; }"

scopeCSS('@keyframes fade { from { opacity:0 } to { opacity:1 } }', 'page-1')
// → "@keyframes fade { from { opacity:0 } to { opacity:1 } }"  (unchanged)

scopeCSS('@media (max-width:768px) { .name { font-size:14px } }', 'page-1')
// → "@media (max-width:768px) { #page-1 .name { font-size:14px } }"
```

Returns `""` for null/empty input.

#### `unscopeCSS(scopedCSS, scopeId) → string`

Removes all `#scopeId ` prefixes. Useful for exporting clean CSS.

```javascript
unscopeCSS('#page-1 .name { color: red; }', 'page-1')
// → ".name { color: red; }"
```

---

## 4. css-patcher

Surgical edits to CSS strings — replace property values, append/remove rules, extract data. Used internally by PatchEngine for the `"css"` op.

### Functions

#### `applyCSSPatch(css, patch) → string`

Applies a single CSS mutation. Patch shapes:

```javascript
// Replace a property value within a selector block
applyCSSPatch(css, { selector: '.name', property: 'color', value: '#ff0000' })

// Append a new rule at the end
applyCSSPatch(css, { action: 'append', rule: '.new { color: red; }' })

// Prepend a rule at the beginning
applyCSSPatch(css, { action: 'prepend', rule: '@import url("...")' })

// Remove an entire rule block by selector
applyCSSPatch(css, { action: 'remove-rule', selector: '.old' })

// Replace the entire body of a rule block
applyCSSPatch(css, { action: 'replace-block', selector: '.name', block: 'color: red; font-size: 20px;' })

// Upsert: set property, creating the rule if it doesn't exist
applyCSSPatch(css, { action: 'upsert', selector: '.name', property: 'color', value: 'red' })
```

If `{ selector, property, value }` targets a selector that doesn't exist, a new rule is appended. If the property doesn't exist within the selector, it's added.

#### `extractSelectors(css) → string[]`

Returns all unique selectors found in the CSS string.

```javascript
extractSelectors('.name { color: red; } .bio { font-size: 14px; }')
// → [".name", ".bio"]
```

Skips `@keyframes` step selectors and `@`-rules.

#### `extractProperties(css, selector) → Record<string, string>`

Returns all property-value pairs from a specific selector's block.

```javascript
extractProperties('.name { color: #00d4ff; font-size: 32px; }', '.name')
// → { color: '#00d4ff', 'font-size': '32px' }
```

Returns `{}` if selector not found.

#### `extractSectionLabels(css) → string[]`

Extracts semantic labels from CSS comments like `/* [color-palette] */`.

```javascript
extractSectionLabels('/* [color-palette] */ .a {} /* [typography] */ .b {}')
// → ["color-palette", "typography"]
```

---

## 5. patch-engine

The core mutation engine. Supports RFC 6902 JSON Patch operations plus an extended `"css"` op. Provides both stateless functions and a stateful class with undo/redo.

### Patch Format

```typescript
interface Patch {
  op: 'replace' | 'add' | 'remove' | 'move' | 'copy' | 'css';
  path?: string;      // JSON Pointer — required for JSON ops
  value?: any;        // required for replace, add
  from?: string;      // required for move, copy
  selector?: string;  // for css op
  property?: string;  // for css op
  action?: string;    // for css op: append, prepend, remove-rule, replace-block, upsert
  rule?: string;      // for css append/prepend
  source?: string;    // "llm" | "user" | "tween" — who created this patch
  timestamp?: number; // auto-set by PatchEngine.apply()
}
```

### Stateless Functions

#### `applyPatch(manifest, patch) → { result: Manifest, inverse: Patch }`

Applies one patch. Returns a NEW manifest (immutable) and the inverse patch for undo.

```javascript
const { result, inverse } = applyPatch(manifest, {
  op: 'replace', path: '/content/name', value: 'Jordan'
});
// result.content.name === 'Jordan'
// inverse === { op: 'replace', path: '/content/name', value: 'Alex' }
```

CSS op example:
```javascript
const { result } = applyPatch(manifest, {
  op: 'css', selector: '.name', property: 'color', value: '#ff0000'
});
```

#### `applyBatch(manifest, patches) → { result: Manifest, inverses: Patch[] }`

Applies patches sequentially. Returns the final manifest and all inverse patches in reverse order (ready for undo).

```javascript
const { result, inverses } = applyBatch(manifest, [
  { op: 'replace', path: '/content/name', value: 'Jordan' },
  { op: 'replace', path: '/layout', value: 'compact' },
  { op: 'css', selector: '.name', property: 'color', value: 'red' },
]);
```

#### `validatePatch(manifest, patch) → { valid: boolean, errors: string[] }`

Validates a patch object without applying it.

```javascript
validatePatch(manifest, { op: 'replace', path: '/content/name', value: 'X' })
// → { valid: true, errors: [] }

validatePatch(manifest, { op: 'merge' })
// → { valid: false, errors: ['Invalid op: "merge"...'] }
```

#### `serializePatches(patches) → string`

JSON.stringify with indentation. For storage/transport.

#### `deserializePatches(json) → Patch[]`

JSON.parse with array validation. Throws if not an array.

### PatchEngine Class (Stateful)

Wraps the stateless functions with history tracking, undo/redo, and metadata.

```javascript
const engine = new PatchEngine();
```

#### `engine.apply(manifest, patch) → Manifest`

Applies a patch, stamps it with `timestamp` and `source`, records it in history, clears redo stack. Returns new manifest.

```javascript
let m = engine.apply(manifest, { op: 'replace', path: '/content/name', value: 'Jordan', source: 'user' });
```

#### `engine.applyBatch(manifest, patches) → Manifest`

Applies multiple patches via repeated `apply()` calls. Each gets its own history entry.

#### `engine.undo(manifest) → Manifest`

Undoes the last patch. Moves it to redo stack. Returns updated manifest. If nothing to undo, returns manifest unchanged.

#### `engine.redo(manifest) → Manifest`

Re-applies the last undone patch. If nothing to redo, returns manifest unchanged.

#### `engine.undoN(manifest, n) → Manifest`

Undo N patches at once.

#### `engine.getHistory() → Patch[]`

Returns a copy of all applied patches (with timestamps and sources).

#### `engine.canUndo → boolean`

#### `engine.canRedo → boolean`

#### `engine.historyLength → number`

#### `engine.clearHistory() → void`

Wipes all history, undo stack, and redo stack.

#### `PatchEngine.squash(original, current) → Patch[]` (static)

Compares two manifests and produces a minimal patch set to transform `original` into `current`. Useful for saving.

```javascript
const minimalPatches = PatchEngine.squash(originalManifest, currentManifest);
// → [{ op: 'replace', path: '/content/name', value: 'Jordan' }, ...]
```

---

## 6. content-presets

10 complete content presets (5 per case) ready to drop into a manifest. Each preset is a full `content` object with realistic data.

### Available Presets

| Case | Presets |
|------|---------|
| `academic-homepage` | `default`, `senior-professor`, `industry-researcher`, `early-career`, `interdisciplinary` |
| `ecommerce-showcase` | `default`, `tech-gadgets`, `fashion`, `food-artisan`, `digital-goods` |

### Functions

#### `getPreset(caseName, presetName?) → object`

Returns a deep clone of the content object. Default preset: `"default"`. Throws for unknown case or preset.

```javascript
const content = getPreset('academic-homepage', 'early-career');
// → { name: "Sam Rivera", title: "1st Year PhD Student", ... }
```

#### `listPresets(caseName) → string[]`

```javascript
listPresets('academic-homepage')
// → ["default", "senior-professor", "industry-researcher", "early-career", "interdisciplinary"]
```

Returns `[]` for unknown cases.

#### `getAllPresets() → Record<string, Record<string, object>>`

Returns a deep clone of the entire preset registry.

#### `registerPreset(caseName, presetName, content) → void`

Add a custom preset at runtime.

```javascript
registerPreset('academic-homepage', 'my-custom', { name: 'Custom User', ... });
```

---

## 7. manifest-render

Framework-agnostic rendering pipeline. Takes manifest(s) and produces `RenderDescriptor` objects that any framework adapter can consume.

### RenderDescriptor Shape

```typescript
interface RenderDescriptor {
  scopeId: string;       // unique ID for CSS scoping (e.g. "page-academic-homepage-0-abc")
  manifest: Manifest;    // the original manifest
  caseName: string;      // e.g. "academic-homepage"
  layout: string;        // e.g. "sidebar-left"
  rootClass: string;     // e.g. "academic-page"
  layoutClass: string;   // e.g. "layout-sidebar-left"
  scopedCSS: string;     // CSS with all selectors prefixed by #scopeId
  content: object;       // content (possibly transformed)
  skeletonKey: string;   // e.g. "academic-homepage/sidebar-left"
}
```

### Interpreter Config

```typescript
interface ManifestInterpreter {
  skeletons?: Record<string, Record<string, Component>>;  // case → layout → component
  scopeCSS?: (css: string, scopeId: string) => string;    // default: built-in scopeCSS
  transformContent?: (content: object, meta: object) => object;  // optional content transform
  generateScopeId?: (manifest: Manifest, index: number) => string;  // custom ID generator
}
```

### Functions

#### `manifestRender(manifests, interpreter?) → RenderDescriptor[]`

Core function. Accepts a single manifest or an array. Returns one descriptor per manifest.

```javascript
const descriptors = manifestRender([manifest1, manifest2, manifest3]);
// → 3 descriptors, each with unique scopeId and scoped CSS
```

Pipeline per manifest:
1. Validate schema
2. Generate unique scope ID
3. Check skeleton exists (if registry provided)
4. Transform content (optional)
5. Scope CSS
6. Build descriptor

Throws on invalid manifests.

#### `manifestRenderOne(manifest, interpreter?) → RenderDescriptor`

Convenience wrapper. Returns a single descriptor (not array).

```javascript
const desc = manifestRenderOne(manifest);
```

#### `renderToHTML(descriptor, htmlRenderer) → string`

Generates a standalone HTML string from a descriptor. The `htmlRenderer` callback provides the inner HTML for the case.

```javascript
const html = renderToHTML(descriptor, (content, layout, rootClass) => {
  return `<h1 class="name">${content.name}</h1>`;
});
// → '<div id="page-..."><style>...</style><div class="academic-page layout-classic">...'
```

#### `renderToFullHTML(descriptor, htmlRenderer, options?) → string`

Generates a complete HTML page with `<!DOCTYPE>`, Google Fonts link, and optional CSS reset.

Options: `{ title, fontsURL, resetCSS }`.

```javascript
const fullPage = renderToFullHTML(descriptor, myRenderer, { title: 'My Page' });
// → '<!DOCTYPE html><html>...'
```

---

## Quick Reference: Import Map

```javascript
import {
  // manifest-schema
  validateManifest, createManifest, cloneManifest,
  getAvailableCases, getLayoutsForCase, getRootClass,
  registerCase, CASE_REGISTRY,

  // css-scoper
  scopeCSS, unscopeCSS,

  // css-patcher
  applyCSSPatch, extractSelectors, extractProperties, extractSectionLabels,

  // json-pointer
  jsonPointer,  // namespace: jsonPointer.get(), .set(), .remove(), .has(), .parse(), .compile()

  // patch-engine
  applyPatch, applyBatch, PatchEngine,
  validatePatch, serializePatches, deserializePatches,

  // content-presets
  getPreset, listPresets, getAllPresets, registerPreset,

  // manifest-render
  manifestRender, manifestRenderOne, renderToHTML, renderToFullHTML,
} from './manifest-engine/index.js';
```
