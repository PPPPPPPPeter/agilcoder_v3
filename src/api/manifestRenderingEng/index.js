/**
 * @manifest/engine — Public API
 * 
 * Core modules for the Manifest v3 architecture.
 * 
 * Modules:
 *   manifest-schema      — validation, factory, case registry
 *   css-scoper           — scope CSS to unique IDs
 *   css-patcher          — surgical CSS string edits
 *   json-pointer         — RFC 6901 path navigation
 *   patch-engine         — RFC 6902 + extended CSS patch ops, undo/redo
 *   content-presets      — 5 presets × 2 cases = 10 starter content sets
 *   manifest-render      — framework-agnostic render pipeline
 *   color-interpolator   — OKLCH perceptual color interpolation
 *   tween-expander       — expand keyframe patches into smooth tween sequences
 *   playback-controller  — stateful scrubber, auto-play, pin-value, step navigation
 */

// Schema & Validation
export {
  validateManifest,
  createManifest,
  cloneManifest,
  getAvailableCases,
  getLayoutsForCase,
  getRootClass,
  registerCase,
  CASE_REGISTRY,
} from './manifest-schema.js';

// CSS Scoping
export { scopeCSS, unscopeCSS } from './css-scoper.js';

// CSS Patching
export {
  applyCSSPatch,
  extractSelectors,
  extractProperties,
  extractSectionLabels,
} from './css-patcher.js';

// JSON Pointer (RFC 6901)
export * as jsonPointer from './json-pointer.js';

// Patch Engine (RFC 6902 + extended)
export {
  applyPatch,
  applyBatch,
  PatchEngine,
  validatePatch,
  serializePatches,
  deserializePatches,
} from './patch-engine.js';

// Content Presets
export {
  getPreset,
  listPresets,
  getAllPresets,
  registerPreset,
} from './content-presets.js';

// Render Pipeline
export {
  manifestRender,
  manifestRenderOne,
  renderToHTML,
  renderToFullHTML,
} from './manifest-render.js';

// // Color Interpolation (OKLCH)
// export {
//   interpolateColor,
//   hexToOklch,
//   oklchToHex,
//   hexToRgb,
//   rgbToHex,
// } from './color-interpolator.js';
//
// // Composite Value Interpolation (box-shadow, transform, filter, gradient)
// export {
//   detectCompositeType,
//   detectCompositeByProperty,
//   interpolateComposite,
// } from './composite-interpolator.js';

// Tween Expansion
// export {
//   classifyValue,
//   interpolateNumeric,
//   expandPatch,
//   expandStep,
//   expandSequence,
//   setDependencies as setTweenDependencies,
// } from './tween-expander.js';

// Playback Controller
// export {
//   PlaybackController,
//   createPlaybackController,
//   registerModules as registerPlaybackModules,
//   GROUP_COLORS,
// } from './playback-controller.js';
