/**
 * Minimal Manifest shape as produced by createManifest() / the rendering engine.
 * Defined here so the PromptCompiler remains a pure-logic module with no React imports.
 */
export interface Manifest {
  meta: {
    case: string          // e.g. "academic-homepage"
    contentPreset: string // e.g. "default"
    description: string
  }
  content: Record<string, unknown>
  layout: string          // e.g. "classic" | "sidebar-left" …
  css: string             // raw CSS string; may be empty on first generation
}

/** Output shape from every compile* function. */
export interface CompiledPrompt {
  system: string
  user: string
}
