/**
 * PromptCompiler — public API
 *
 * Two entry points:
 *  • `compileApplyNowPrompt`  — Apply Now button (in-place single-variant edit)
 *  • `compileChatSendPrompt`  — Chat Send button (cross-variant refinement / fresh generation)
 *
 * Both return `{ system: string, user: string }` ready to be forwarded to an LLM.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type { Manifest, CompiledPrompt } from './types.js'

// ─── Input shapes ─────────────────────────────────────────────────────────────
export type { ApplyNowInput }  from './compileApplyNowPrompt.js'
export type { ChatSendInput }  from './compileChatSendPrompt.js'

// ─── Compile functions ────────────────────────────────────────────────────────
export { compileApplyNowPrompt }  from './compileApplyNowPrompt.js'
export { compileChatSendPrompt }  from './compileChatSendPrompt.js'

// ─── Lower-level helpers (exported for testing / advanced use) ────────────────
export { buildSystemPreamble }  from './buildSystemPreamble.js'
export { compileAnnotations }   from './compileAnnotations.js'
