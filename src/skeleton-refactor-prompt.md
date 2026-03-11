# Refactor Skeleton Components: Layout-Based Routing + Semantic CSS Classes

## Problem

The current `PreviewContent` component routes skeleton layouts by **preset name** (`senior-professor` → Layout2). This is wrong — it should route by the manifest's **layout field** (`sidebar-left`, `compact`, etc.) so that any content preset can be rendered in any layout.

Additionally, all visual styling is hardcoded via Tailwind classes. The manifest's `css` field is never injected, so LLM-generated CSS has no effect.

## What to change

### 1. Route by layout, not preset

Change `PreviewContent` to switch on the manifest's `layout` value instead of `presetName`. The 5 academic layouts should map to the 5 layout names registered in the manifest schema:

```
"classic"        → single-column linear layout (current Layout1)
"sidebar-left"   → two-column, sidebar on left (current Layout2)
"sidebar-right"  → two-column, sidebar on right (mirror of Layout2)
"hero-banner"    → dark header + split body (current Layout3)
"compact"        → minimal centered (current Layout4)
```

Layout5 (bibliography style) can be merged into one of the above or kept as an alternative for `classic`. Your call based on what makes sense.

The `PreviewContent` props should accept the full `RenderDescriptor` (or at minimum `layout`, `content`, `scopeId`, `scopedCSS`) instead of `presetName`.

### 2. Add semantic CSS classes to all elements

Every meaningful element in the skeleton must have a **semantic CSS class** that matches what the LLM will target. These classes are the contract between the skeleton and the CSS.

Required classes (at minimum):

```
.page-root          → the outermost layout wrapper
.nav-bar            → the navigation bar
.nav-item           → individual nav links
.profile-section    → the avatar + name + title group
.avatar             → the avatar/initials circle
.name               → the person's name (h1)
.title              → the person's job title
.affiliation        → university/company name
.stats-bar          → the stats row/column container
.stat-item          → individual stat (publications: 186)
.stat-value         → the number
.stat-label         → the label text
.bio                → the about/bio paragraph
.links-row          → the row of external links
.link-item          → individual link button
.section-heading    → any section heading (News, Publications, etc.)
.news-section       → news container
.news-item          → individual news entry
.news-date          → the date text
.news-text          → the news content
.publications-section → publications container
.publication-card   → individual publication
.publication-title  → publication title text
.publication-venue  → venue + year text
.publication-tag    → individual tag badge
.projects-section   → projects container
.project-card       → individual project
.project-title      → project title
.project-desc       → project description
.project-status     → status badge
.skills-section     → skills container
.skill-tag          → individual skill badge
```

Apply these classes **alongside** minimal Tailwind structural classes. Tailwind should only handle layout structure (flex, grid, overflow, positioning). All visual properties (colors, fonts, spacing, borders, shadows, backgrounds) should come from the manifest CSS.

Example — before:
```jsx
<h1 className="text-2xl font-bold mb-0.5">{c.name}</h1>
```

After:
```jsx
<h1 className="name">{c.name}</h1>
```

The `text-2xl font-bold mb-0.5` will now come from the manifest's CSS: `.name { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.125rem; }`.

Tailwind is still OK for pure structure, e.g.:
```jsx
<div className="flex items-start gap-6 profile-section">
```

### 3. Add `data-content-path` attributes

Every element that renders content from the manifest should have a `data-content-path` attribute with its JSON Pointer path. This is used by the feedback selection system.

```jsx
<h1 className="name" data-content-path="/content/name">{c.name}</h1>
<p className="bio" data-content-path="/content/bio">{c.bio}</p>
<p className="title" data-content-path="/content/title">{c.title}</p>

{c.publications.map((pub, i) => (
  <div className="publication-card" data-content-path={`/content/publications/${i}`}>
    <p className="publication-title" data-content-path={`/content/publications/${i}/title`}>{pub.title}</p>
  </div>
))}
```

### 4. Inject manifest CSS via scoped `<style>` tag

The preview container must inject the manifest's `scopedCSS` into the DOM. Inside the scoped wrapper `<div id="{scopeId}">`, add a `<style>` tag:

```jsx
<div id={descriptor.scopeId}>
  <style>{descriptor.scopedCSS}</style>
  <div className={`${descriptor.rootClass} layout-${descriptor.layout}`}>
    {/* skeleton content */}
  </div>
</div>
```

This way the LLM's CSS (scoped by `scopeCSS()` to `#scopeId`) will apply to the semantic classes on the skeleton elements.

### 5. Provide base/default CSS

Since the skeletons will no longer have Tailwind visual styles, you need a **base CSS** that provides sensible defaults so the page doesn't look broken when `manifest.css` is empty. This base CSS should be minimal and easily overridable:

```css
/* base-academic.css — default styles, overridden by manifest CSS */
.name { font-size: 1.5rem; font-weight: 700; color: #111; }
.title { font-size: 0.875rem; color: #6b7280; }
.affiliation { font-size: 0.75rem; color: #9ca3af; }
.bio { font-size: 0.875rem; line-height: 1.625; color: #374151; }
.section-heading { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
/* ... etc for all semantic classes ... */
```

This base CSS can be prepended to the manifest's CSS before scoping, or included as a separate `<style>` block.

## What NOT to change

- Do not modify the feedback mode system, Chat tab, Action Popover, or any annotation logic.
- Do not change the manifest schema or engine modules.
- Do not change the header thumbnail strip behavior.
