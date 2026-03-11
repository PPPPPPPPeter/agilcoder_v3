/**
 * manifest-render.js
 * 
 * The core rendering pipeline. Takes manifest(s) + interpreter,
 * returns render descriptors that any framework can consume.
 * 
 * This module is framework-agnostic — it does NOT import React.
 * A thin React adapter (or Vue/Svelte/vanilla adapter) wraps this.
 * 
 * Dependencies: manifest-schema.js, css-scoper.js (internal only)
 */

import { validateManifest, getRootClass } from './manifest-schema.js';
import { scopeCSS } from './css-scoper.js';

// ─── Default Interpreter ───────────────────────────────────────────

const defaultInterpreter = {
  skeletons: {},     // Must be populated by the consuming app
  scopeCSS: scopeCSS,
  transformContent: null,
  generateScopeId: null,
};

/**
 * Core render pipeline. Returns an array of RenderDescriptor objects.
 * 
 * A RenderDescriptor is a plain object:
 *   {
 *     scopeId:     string  — unique scope ID for this page
 *     manifest:    object  — the original manifest
 *     caseName:    string  — e.g. "academic-homepage"
 *     layout:      string  — e.g. "sidebar-left"
 *     rootClass:   string  — e.g. "academic-page"
 *     scopedCSS:   string  — CSS with all selectors scoped
 *     content:     object  — content (possibly transformed)
 *     skeletonKey: string  — key to look up the skeleton component
 *   }
 * 
 * The framework adapter turns these into actual DOM / virtual DOM.
 * 
 * @param {object|object[]} manifests   — one or many manifests
 * @param {object} interpreter          — rendering configuration
 * @returns {RenderDescriptor[]}
 */
export function manifestRender(manifests, interpreter = {}) {
  const interp = { ...defaultInterpreter, ...interpreter };
  const list = Array.isArray(manifests) ? manifests : [manifests];

  return list.map((manifest, index) => {
    // 1. Validate
    const { valid, errors } = validateManifest(manifest);
    if (!valid) {
      throw new Error(`Invalid manifest at index ${index}: ${errors.join('; ')}`);
    }

    const { meta, content, layout, css } = manifest;

    // 2. Generate scope ID
    const scopeId = interp.generateScopeId
      ? interp.generateScopeId(manifest, index)
      : `page-${meta.case}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 3. Check skeleton exists (if registry provided)
    const skeletonKey = `${meta.case}/${layout}`;
    if (Object.keys(interp.skeletons).length > 0) {
      const caseSkel = interp.skeletons[meta.case];
      if (!caseSkel || !caseSkel[layout]) {
        throw new Error(`No skeleton registered for ${skeletonKey}`);
      }
    }

    // 4. Transform content
    const finalContent = interp.transformContent
      ? interp.transformContent(content, meta)
      : content;

    // 5. Scope CSS
    const scopedCSS = interp.scopeCSS(css || '', scopeId);

    // 6. Get root class
    const rootClass = getRootClass(meta.case) || meta.case;

    return {
      scopeId,
      manifest,
      caseName: meta.case,
      layout,
      rootClass,
      layoutClass: `layout-${layout}`,
      scopedCSS,
      content: finalContent,
      skeletonKey,
    };
  });
}

/**
 * Convenience: render a single manifest. Returns one descriptor (not array).
 */
export function manifestRenderOne(manifest, interpreter = {}) {
  return manifestRender(manifest, interpreter)[0];
}

/**
 * Generate a standalone HTML string from a RenderDescriptor.
 * Useful for export, SSR, or previewing without React.
 * 
 * The `htmlRenderer` callback takes (content, layout, rootClass) and
 * returns the inner HTML string. This must be provided per-case.
 */
export function renderToHTML(descriptor, htmlRenderer) {
  if (!htmlRenderer) {
    throw new Error('renderToHTML requires an htmlRenderer callback');
  }

  const innerHTML = htmlRenderer(descriptor.content, descriptor.layout, descriptor.rootClass);

  return `<div id="${descriptor.scopeId}">
  <style>${descriptor.scopedCSS}</style>
  <div class="${descriptor.rootClass} ${descriptor.layoutClass}">
    ${innerHTML}
  </div>
</div>`;
}

/**
 * Generate a full standalone HTML page (with head, fonts, etc.)
 */
export function renderToFullHTML(descriptor, htmlRenderer, options = {}) {
  const {
    title = 'Manifest Page',
    fontsURL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap',
    resetCSS = true,
  } = options;

  const body = renderToHTML(descriptor, htmlRenderer);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="${fontsURL}" rel="stylesheet">
  ${resetCSS ? '<style>*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }</style>' : ''}
</head>
<body>
  ${body}
</body>
</html>`;
}
