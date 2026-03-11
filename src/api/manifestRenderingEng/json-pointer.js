/**
 * json-pointer.js
 * 
 * RFC 6901 JSON Pointer implementation.
 * Used by PatchEngine to navigate and mutate nested objects.
 * 
 * Paths look like: "/content/name", "/content/skills/3", "/content/publications/-"
 * The "-" token means "append to end of array".
 * 
 * Pure logic — no dependencies.
 */

/**
 * Parse a JSON Pointer string into an array of tokens.
 * "/content/name" → ["content", "name"]
 * "/" → [""]
 * "" → []
 */
export function parse(pointer) {
  if (pointer === '') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(`Invalid JSON Pointer: must start with "/" — got "${pointer}"`);
  }
  return pointer
    .slice(1)
    .split('/')
    .map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/**
 * Compile an array of tokens back into a pointer string.
 * ["content", "name"] → "/content/name"
 */
export function compile(tokens) {
  if (tokens.length === 0) return '';
  return '/' + tokens.map(t => t.replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
}

/**
 * Get the value at a JSON Pointer path.
 * Returns undefined if the path doesn't exist.
 */
export function get(obj, pointer) {
  const tokens = typeof pointer === 'string' ? parse(pointer) : pointer;
  let current = obj;

  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const idx = parseInt(token, 10);
      if (isNaN(idx)) return undefined;
      current = current[idx];
    } else if (typeof current === 'object') {
      current = current[token];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a value at a JSON Pointer path. Mutates the object in-place.
 * Creates intermediate objects/arrays as needed.
 * 
 * The "-" token on an array means "append".
 * 
 * @returns the previous value at that path (or undefined)
 */
export function set(obj, pointer, value) {
  const tokens = typeof pointer === 'string' ? parse(pointer) : pointer;
  if (tokens.length === 0) {
    throw new Error('Cannot set root via JSON Pointer — replace the entire object instead');
  }

  let current = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const next = tokens[i + 1];

    if (Array.isArray(current)) {
      const idx = parseInt(token, 10);
      if (current[idx] === undefined || current[idx] === null) {
        current[idx] = isArrayIndex(next) ? [] : {};
      }
      current = current[idx];
    } else {
      if (current[token] === undefined || current[token] === null) {
        current[token] = isArrayIndex(next) ? [] : {};
      }
      current = current[token];
    }
  }

  const lastToken = tokens[tokens.length - 1];

  if (Array.isArray(current)) {
    if (lastToken === '-') {
      // Append to array
      current.push(value);
      return undefined;
    }
    const idx = parseInt(lastToken, 10);
    const prev = current[idx];
    current[idx] = value;
    return prev;
  }

  const prev = current[lastToken];
  current[lastToken] = value;
  return prev;
}

/**
 * Remove a value at a JSON Pointer path. Mutates in-place.
 * For arrays, splices the element out (doesn't leave a hole).
 * 
 * @returns the removed value
 */
export function remove(obj, pointer) {
  const tokens = typeof pointer === 'string' ? parse(pointer) : pointer;
  if (tokens.length === 0) {
    throw new Error('Cannot remove root');
  }

  // Navigate to parent
  const parentTokens = tokens.slice(0, -1);
  const parent = get(obj, parentTokens);
  const lastToken = tokens[tokens.length - 1];

  if (parent === undefined || parent === null) {
    throw new Error(`Path not found: ${compile(tokens)}`);
  }

  if (Array.isArray(parent)) {
    const idx = parseInt(lastToken, 10);
    if (isNaN(idx) || idx < 0 || idx >= parent.length) {
      throw new Error(`Array index out of bounds: ${lastToken}`);
    }
    return parent.splice(idx, 1)[0];
  }

  if (typeof parent === 'object') {
    const prev = parent[lastToken];
    delete parent[lastToken];
    return prev;
  }

  throw new Error(`Cannot remove from non-object/array at ${compile(parentTokens)}`);
}

/**
 * Check if a path exists on an object.
 */
export function has(obj, pointer) {
  const tokens = typeof pointer === 'string' ? parse(pointer) : pointer;
  let current = obj;

  for (const token of tokens) {
    if (current === null || current === undefined) return false;
    if (Array.isArray(current)) {
      const idx = parseInt(token, 10);
      if (isNaN(idx) || idx < 0 || idx >= current.length) return false;
      current = current[idx];
    } else if (typeof current === 'object') {
      if (!(token in current)) return false;
      current = current[token];
    } else {
      return false;
    }
  }

  return true;
}

// ─── Internal ──────────────────────────────────────────────────────

function isArrayIndex(token) {
  return token === '-' || /^\d+$/.test(token);
}
