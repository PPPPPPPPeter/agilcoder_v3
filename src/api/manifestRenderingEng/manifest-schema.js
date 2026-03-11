/**
 * manifest-schema.js
 * 
 * Manifest v3 schema definition, validation, and factory.
 * Pure logic — no React, no DOM, no external deps.
 * 
 * A manifest is the single source of truth:
 *   { meta, content, layout, css }
 */

// ─── Registry of known cases and their valid layouts ───────────────
const CASE_REGISTRY = {
  'academic-homepage': {
    layouts: ['classic', 'sidebar-left', 'sidebar-right', 'hero-banner', 'compact'],
    rootClass: 'academic-page',
  },
  // 'ecommerce-showcase': {
  //   layouts: ['standard', 'sidebar-filters', 'magazine', 'minimal', 'showcase'],
  //   rootClass: 'ecommerce-page',
  // },
};

// ─── Validation ────────────────────────────────────────────────────

/**
 * Validate a manifest object. Returns { valid, errors }.
 * Does NOT throw — caller decides how to handle errors.
 */
export function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null object'] };
  }

  // meta
  if (!manifest.meta || typeof manifest.meta !== 'object') {
    errors.push('Missing or invalid "meta" object');
  } else {
    if (!manifest.meta.case || typeof manifest.meta.case !== 'string') {
      errors.push('meta.case must be a non-empty string');
    } else if (!CASE_REGISTRY[manifest.meta.case]) {
      errors.push(`Unknown case "${manifest.meta.case}". Known: ${Object.keys(CASE_REGISTRY).join(', ')}`);
    }
  }

  // content
  if (!manifest.content || typeof manifest.content !== 'object') {
    errors.push('Missing or invalid "content" object');
  }

  // layout
  if (!manifest.layout || typeof manifest.layout !== 'string') {
    errors.push('Missing or invalid "layout" string');
  } else if (manifest.meta?.case && CASE_REGISTRY[manifest.meta.case]) {
    const validLayouts = CASE_REGISTRY[manifest.meta.case].layouts;
    if (!validLayouts.includes(manifest.layout)) {
      errors.push(`Invalid layout "${manifest.layout}" for case "${manifest.meta.case}". Valid: ${validLayouts.join(', ')}`);
    }
  }

  // css
  if (typeof manifest.css !== 'string') {
    errors.push('"css" must be a string');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Factory ───────────────────────────────────────────────────────

/**
 * Create a well-formed manifest object.
 * Fills in sensible defaults for missing fields.
 */
export function createManifest({ caseName, preset = 'default', content, layout, css = '', description = '' }) {
  const caseInfo = CASE_REGISTRY[caseName];
  if (!caseInfo) {
    throw new Error(`Unknown case: ${caseName}`);
  }

  const resolvedLayout = layout || caseInfo.layouts[0];
  if (!caseInfo.layouts.includes(resolvedLayout)) {
    throw new Error(`Invalid layout "${resolvedLayout}" for case "${caseName}"`);
  }

  return {
    meta: {
      case: caseName,
      contentPreset: preset,
      description,
    },
    content: content || {},
    layout: resolvedLayout,
    css,
  };
}

// ─── Deep clone (structural) ───────────────────────────────────────

export function cloneManifest(manifest) {
  return JSON.parse(JSON.stringify(manifest));
}

// ─── Utilities ─────────────────────────────────────────────────────

export function getAvailableCases() {
  return Object.keys(CASE_REGISTRY);
}

export function getLayoutsForCase(caseName) {
  return CASE_REGISTRY[caseName]?.layouts || [];
}

export function getRootClass(caseName) {
  return CASE_REGISTRY[caseName]?.rootClass || null;
}

/**
 * Register a new case at runtime (for extensibility).
 */
export function registerCase(caseName, { layouts, rootClass }) {
  if (CASE_REGISTRY[caseName]) {
    throw new Error(`Case "${caseName}" already registered`);
  }
  CASE_REGISTRY[caseName] = { layouts: [...layouts], rootClass };
}

export { CASE_REGISTRY };
