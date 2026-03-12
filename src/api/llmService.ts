/**
 * LLMService — thin Claude API client.
 *
 * Responsibilities:
 *   - Store and validate the Anthropic API key (in-memory only, never persisted)
 *   - Send { system, user } prompt pairs to the Claude Messages API
 *   - Return raw response text (no JSON parsing — that belongs to LLMResponseParser)
 *
 * Pure TypeScript — no React, no hooks, no side effects.
 *
 * Orchestration flow:
 *   PromptCompiler → callLLM → LLMResponseParser → state update
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL             = 'claude-sonnet-4-20250514'
const MAX_TOKENS        = 4096
const API_ENDPOINT      = '/api/anthropic/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// ─── Key management ───────────────────────────────────────────────────────────

/** In-memory API key — never written to disk or localStorage. */
let apiKey: string | null = null

/**
 * Set the Anthropic API key at runtime.
 * Called from the Settings UI when the user pastes their key.
 * Passing an empty string clears the key.
 */
export function setApiKey(key: string): void {
  apiKey = key.trim() || null
}

/** Returns true when an API key has been configured. */
export function hasApiKey(): boolean {
  return apiKey !== null && apiKey.length > 0
}

// ─── Request / response types (internal) ────────────────────────────────────

interface AnthropicRequestBody {
  model:      string
  max_tokens: number
  system:     string
  messages:   Array<{ role: 'user'; content: string }>
}

interface AnthropicResponseBody {
  content?: Array<{ type: string; text: string }>
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Send a compiled prompt to Claude and return the raw text response.
 *
 * Input:  `{ system, user }` from PromptCompiler.
 * Output: raw string (expected to be JSON, but this module does NOT parse it).
 *
 * All errors are user-friendly strings that can be shown directly in the Chat tab.
 *
 * @throws {Error} With a user-friendly message for every failure mode.
 */
export async function callLLM(prompt: {
  system: string
  user:   string
}): Promise<string> {
  if (!hasApiKey()) {
    throw new Error(
      'No API key configured. Please set your Anthropic API key in Settings.',
    )
  }

  const body: AnthropicRequestBody = {
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     prompt.system,
    messages:   [{ role: 'user', content: prompt.user }],
  }

  // ── Debug logging — remove once the proxy is confirmed working ──────────────
  const requestHeaders = {
    'Content-Type':      'application/json',
    'x-api-key':         apiKey!.slice(0, 8) + '…',
    'anthropic-version': ANTHROPIC_VERSION,
  }
  console.log('[callLLM] endpoint:', API_ENDPOINT)
  console.log('[callLLM] headers (key truncated):', requestHeaders)

  // ── Network call ────────────────────────────────────────────────────────────
  let response: Response
  try {
    response = await fetch(API_ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type':                              'application/json',
        'x-api-key':                                 apiKey!,
        'anthropic-version':                         ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Network error. Check your connection.')
  }

  // ── HTTP error handling ─────────────────────────────────────────────────────
  if (!response.ok) {
    const status = response.status

    if (status === 401) {
      // Read the body so we can show Anthropic's actual error message in the console
      let detail = ''
      try { detail = await response.text() } catch { /* ignore */ }
      console.error('[callLLM] 401 body:', detail)
      throw new Error(`Invalid API key. (Anthropic said: ${detail.slice(0, 200)})`)
    }
    if (status === 429) {
      throw new Error('Rate limited. Please wait and try again.')
    }
    if (status >= 500) {
      throw new Error('Claude API is temporarily unavailable.')
    }

    // Other 4xx — include a brief excerpt of the body for diagnostics
    let excerpt = ''
    try {
      const raw = await response.text()
      excerpt = raw.slice(0, 140)
    } catch { /* ignore read errors */ }

    throw new Error(
      `Claude API error (HTTP ${status})${excerpt ? ': ' + excerpt : ''}`,
    )
  }

  // ── Parse response body ─────────────────────────────────────────────────────
  let data: AnthropicResponseBody
  try {
    data = (await response.json()) as AnthropicResponseBody
  } catch {
    throw new Error('Claude API returned an unreadable response.')
  }

  const text = data.content?.[0]?.text
  if (typeof text !== 'string') {
    throw new Error('Claude API response is missing expected text content.')
  }

  return text
}

// ─── Streaming (future) ───────────────────────────────────────────────────────

/**
 * Future: stream responses for real-time UI updates using SSE.
 * Currently falls back to `callLLM()` — the `onChunk` callback is not invoked.
 *
 * TODO: implement using `fetch` + `ReadableStream` with `stream: true` body flag
 * and `text/event-stream` response parsing.
 */
export async function callLLMStream(
  prompt:   { system: string; user: string },
  _onChunk?: (text: string) => void,
): Promise<string> {
  // Streaming not yet implemented — delegate to the non-streaming path.
  return callLLM(prompt)
}
