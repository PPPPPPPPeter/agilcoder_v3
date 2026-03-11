/**
 * patch-engine.js
 * 
 * Unified mutation engine for manifest.json.
 * Supports RFC 6902 JSON Patch ops (replace, add, remove, move, copy)
 * plus an extended "css" op for surgical CSS string edits.
 * 
 * Maintains a history stack for undo/redo.
 * All operations are immutable — apply() returns a NEW manifest.
 * 
 * Dependencies: json-pointer.js, css-patcher.js (internal modules only)
 */

import * as jp from './json-pointer.js';
import { applyCSSPatch } from './css-patcher.js';

// ─── Patch Application ────────────────────────────────────────────

/**
 * Apply a single patch to a manifest. Returns a NEW manifest (immutable).
 * Also returns the inverse patch for undo.
 * 
 * @param {object} manifest — current manifest
 * @param {object} patch    — patch to apply
 * @returns {{ result: object, inverse: object }}
 */
export function applyPatch(manifest, patch) {
  const clone = JSON.parse(JSON.stringify(manifest));

  let inverse;

  switch (patch.op) {
    case 'replace': {
      const prev = jp.get(clone, patch.path);
      jp.set(clone, patch.path, deepCloneValue(patch.value));
      inverse = { op: 'replace', path: patch.path, value: prev, source: '_undo' };
      break;
    }

    case 'add': {
      jp.set(clone, patch.path, deepCloneValue(patch.value));
      inverse = { op: 'remove', path: patch.path, source: '_undo' };
      // If we appended to array (path ends with /-), fix the inverse path
      if (patch.path.endsWith('/-')) {
        const tokens = jp.parse(patch.path);
        tokens.pop(); // remove "-"
        const arr = jp.get(clone, tokens);
        if (Array.isArray(arr)) {
          inverse = { op: 'remove', path: jp.compile([...tokens, String(arr.length - 1)]), source: '_undo' };
        }
      }
      break;
    }

    case 'remove': {
      const prev = jp.get(clone, patch.path);
      jp.remove(clone, patch.path);
      inverse = { op: 'add', path: patch.path, value: prev, source: '_undo' };
      break;
    }

    case 'move': {
      const value = jp.get(clone, patch.from);
      jp.remove(clone, patch.from);
      jp.set(clone, patch.path, value);
      inverse = { op: 'move', path: patch.from, from: patch.path, source: '_undo' };
      break;
    }

    case 'copy': {
      const value = jp.get(clone, patch.from);
      jp.set(clone, patch.path, deepCloneValue(value));
      inverse = { op: 'remove', path: patch.path, source: '_undo' };
      break;
    }

    case 'css': {
      const prevCSS = clone.css;
      clone.css = applyCSSPatch(clone.css, patch);
      inverse = { op: 'replace', path: '/css', value: prevCSS, source: '_undo' };
      break;
    }

    default:
      throw new Error(`Unknown patch op: "${patch.op}"`);
  }

  return { result: clone, inverse };
}

/**
 * Apply a batch of patches sequentially. Returns the final manifest
 * and all inverse patches (in reverse order, ready for undo).
 */
export function applyBatch(manifest, patches) {
  let current = manifest;
  const inverses = [];

  for (const patch of patches) {
    const { result, inverse } = applyPatch(current, patch);
    current = result;
    inverses.unshift(inverse); // reverse order for undo
  }

  return { result: current, inverses };
}

// ─── PatchEngine Class (stateful wrapper) ──────────────────────────

export class PatchEngine {
  #history = [];      // all applied patches
  #undoStack = [];    // inverse patches for undo
  #redoStack = [];    // patches that were undone

  constructor() {}

  /**
   * Apply a patch. Returns the new manifest.
   */
  apply(manifest, patch) {
    const stamped = {
      ...patch,
      timestamp: patch.timestamp || Date.now(),
      source: patch.source || 'unknown',
    };

    const { result, inverse } = applyPatch(manifest, stamped);

    this.#history.push(stamped);
    this.#undoStack.push(inverse);
    this.#redoStack = []; // clear redo on new action

    return result;
  }

  /**
   * Apply a batch of patches. Returns the new manifest.
   */
  applyBatch(manifest, patches) {
    let current = manifest;
    for (const p of patches) {
      current = this.apply(current, p);
    }
    return current;
  }

  /**
   * Undo the last patch. Returns the new manifest.
   */
  undo(manifest) {
    const inversePatch = this.#undoStack.pop();
    if (!inversePatch) return manifest; // nothing to undo

    const originalPatch = this.#history.pop();
    const { result } = applyPatch(manifest, inversePatch);

    this.#redoStack.push(originalPatch);
    return result;
  }

  /**
   * Redo the last undone patch. Returns the new manifest.
   */
  redo(manifest) {
    const patch = this.#redoStack.pop();
    if (!patch) return manifest; // nothing to redo

    return this.apply(manifest, patch);
  }

  /**
   * Undo N patches at once.
   */
  undoN(manifest, n) {
    let current = manifest;
    for (let i = 0; i < n && this.#undoStack.length > 0; i++) {
      current = this.undo(current);
    }
    return current;
  }

  /**
   * Get full history of applied patches.
   */
  getHistory() {
    return [...this.#history];
  }

  /**
   * Can we undo?
   */
  get canUndo() {
    return this.#undoStack.length > 0;
  }

  /**
   * Can we redo?
   */
  get canRedo() {
    return this.#redoStack.length > 0;
  }

  /**
   * Number of patches in history.
   */
  get historyLength() {
    return this.#history.length;
  }

  /**
   * Clear all history (e.g. after saving).
   */
  clearHistory() {
    this.#history = [];
    this.#undoStack = [];
    this.#redoStack = [];
  }

  /**
   * Squash the entire history into a minimal diff from the
   * original manifest to the current one.
   * 
   * This doesn't squash automatically — it takes the original
   * and current manifests and produces a minimal patch set.
   */
  static squash(original, current) {
    const patches = [];

    // Compare top-level fields
    if (original.layout !== current.layout) {
      patches.push({ op: 'replace', path: '/layout', value: current.layout });
    }
    if (original.css !== current.css) {
      patches.push({ op: 'replace', path: '/css', value: current.css });
    }
    if (JSON.stringify(original.meta) !== JSON.stringify(current.meta)) {
      patches.push({ op: 'replace', path: '/meta', value: current.meta });
    }

    // Deep diff content
    const contentPatches = diffObjects(original.content, current.content, '/content');
    patches.push(...contentPatches);

    return patches;
  }
}

// ─── Patch Validation ──────────────────────────────────────────────

/**
 * Validate a patch against a manifest schema.
 * Returns { valid, errors }.
 */
export function validatePatch(manifest, patch) {
  const errors = [];

  if (!patch || typeof patch !== 'object') {
    return { valid: false, errors: ['Patch must be a non-null object'] };
  }

  const validOps = ['replace', 'add', 'remove', 'move', 'copy', 'css'];
  if (!validOps.includes(patch.op)) {
    errors.push(`Invalid op: "${patch.op}". Valid: ${validOps.join(', ')}`);
  }

  // Path validation for JSON ops
  if (['replace', 'add', 'remove', 'move', 'copy'].includes(patch.op)) {
    if (!patch.path || typeof patch.path !== 'string' || !patch.path.startsWith('/')) {
      errors.push('JSON patch ops require a "path" starting with "/"');
    }
  }

  // Value required for replace, add
  if (['replace', 'add'].includes(patch.op) && patch.value === undefined) {
    errors.push(`"${patch.op}" requires a "value" field`);
  }

  // from required for move, copy
  if (['move', 'copy'].includes(patch.op)) {
    if (!patch.from || typeof patch.from !== 'string') {
      errors.push(`"${patch.op}" requires a "from" field`);
    }
  }

  // CSS op validation
  if (patch.op === 'css') {
    if (patch.action) {
      const validActions = ['append', 'prepend', 'remove-rule', 'replace-block', 'upsert'];
      if (!validActions.includes(patch.action)) {
        errors.push(`Invalid CSS action: "${patch.action}"`);
      }
      if (['append', 'prepend'].includes(patch.action) && !patch.rule) {
        errors.push(`CSS "${patch.action}" requires a "rule" field`);
      }
    } else {
      if (!patch.selector) errors.push('CSS patch requires "selector" or "action"');
      if (!patch.property) errors.push('CSS property patch requires "property"');
      if (patch.value === undefined) errors.push('CSS property patch requires "value"');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Serialization ─────────────────────────────────────────────────

/**
 * Serialize a patch set to JSON string (for storage, transport).
 */
export function serializePatches(patches) {
  return JSON.stringify(patches, null, 2);
}

/**
 * Deserialize a JSON string back to patch array.
 */
export function deserializePatches(json) {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Patches must be an array');
  }
  return parsed;
}

// ─── Internal Helpers ──────────────────────────────────────────────

function deepCloneValue(v) {
  if (v === undefined || v === null) return v;
  if (typeof v !== 'object') return v;
  return JSON.parse(JSON.stringify(v));
}

/**
 * Shallow diff two objects, producing JSON Patch ops.
 * Only goes one level deep into primitives and arrays-as-values.
 */
function diffObjects(original, current, basePath) {
  const patches = [];

  if (original === current) return patches;
  if (typeof original !== 'object' || typeof current !== 'object') {
    patches.push({ op: 'replace', path: basePath, value: current });
    return patches;
  }

  const allKeys = new Set([...Object.keys(original || {}), ...Object.keys(current || {})]);

  for (const key of allKeys) {
    const path = `${basePath}/${key}`;
    const ov = original?.[key];
    const cv = current?.[key];

    if (cv === undefined) {
      patches.push({ op: 'remove', path });
    } else if (ov === undefined) {
      patches.push({ op: 'add', path, value: cv });
    } else if (JSON.stringify(ov) !== JSON.stringify(cv)) {
      patches.push({ op: 'replace', path, value: cv });
    }
  }

  return patches;
}
