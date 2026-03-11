/**
 * css-scoper.js
 * 
 * Scopes a raw CSS string to a unique wrapper ID.
 * Every selector gets prefixed with #scopeId so that
 * multiple manifests can coexist on the same page.
 * 
 * Handles: regular selectors, comma-separated selectors,
 * @keyframes (left unscoped), @media (recurse into block),
 * @font-face, @import (pass through), comments.
 * 
 * Pure string logic — no DOM, no dependencies.
 */

/**
 * Scope all CSS selectors under #scopeId.
 * 
 * @param {string} css     — raw CSS string (no scope prefix)
 * @param {string} scopeId — unique ID (e.g. "page-academic-0-171000000")
 * @returns {string}       — scoped CSS
 */
export function scopeCSS(css, scopeId) {
  if (!css || !scopeId) return css || '';

  const prefix = `#${scopeId}`;
  const result = [];
  let i = 0;

  while (i < css.length) {
    // Skip whitespace
    if (/\s/.test(css[i])) {
      result.push(css[i]);
      i++;
      continue;
    }

    // Skip comments
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) {
        result.push(css.slice(i));
        break;
      }
      result.push(css.slice(i, end + 2));
      i = end + 2;
      continue;
    }

    // @-rules
    if (css[i] === '@') {
      const atRule = extractAtRule(css, i);

      if (atRule.name === 'keyframes' || atRule.name === '-webkit-keyframes') {
        // Don't scope keyframe internals — but do scope the name reference
        result.push(css.slice(i, i + atRule.length));
        i += atRule.length;
        continue;
      }

      if (atRule.name === 'import' || atRule.name === 'charset' || atRule.name === 'namespace') {
        // Pass through as-is (no block)
        result.push(css.slice(i, i + atRule.length));
        i += atRule.length;
        continue;
      }

      if (atRule.name === 'font-face') {
        // Pass through as-is
        result.push(css.slice(i, i + atRule.length));
        i += atRule.length;
        continue;
      }

      if (atRule.name === 'media' || atRule.name === 'supports' || atRule.name === 'container' || atRule.name === 'layer') {
        // Recurse: scope the inner CSS, keep the @rule wrapper
        const header = css.slice(i, atRule.bodyStart);
        const body = css.slice(atRule.bodyStart + 1, atRule.bodyEnd);
        result.push(header + '{');
        result.push(scopeCSS(body, scopeId));
        result.push('}');
        i = atRule.bodyEnd + 1;
        continue;
      }

      // Unknown @-rule — pass through
      result.push(css.slice(i, i + atRule.length));
      i += atRule.length;
      continue;
    }

    // Regular rule: selector(s) { declarations }
    const blockStart = css.indexOf('{', i);
    if (blockStart === -1) {
      // No more blocks — trailing garbage, just append
      result.push(css.slice(i));
      break;
    }

    const selectorPart = css.slice(i, blockStart).trim();
    const blockEnd = findMatchingBrace(css, blockStart);
    const declarations = css.slice(blockStart + 1, blockEnd);

    // Scope each comma-separated selector
    const scopedSelectors = selectorPart
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        // Don't scope keyframe step selectors (from, to, NN%)
        if (/^(from|to|\d+%)$/.test(s)) return s;
        return `${prefix} ${s}`;
      })
      .join(', ');

    result.push(`${scopedSelectors} {${declarations}}`);
    i = blockEnd + 1;
  }

  return result.join('');
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Extract info about an @-rule starting at position `start`.
 */
function extractAtRule(css, start) {
  // Get the @-name (e.g. "media", "keyframes")
  const nameMatch = css.slice(start).match(/^@([\w-]+)/);
  const name = nameMatch ? nameMatch[1] : '';

  // Find if this @-rule has a block or ends with semicolon
  let j = start + 1;
  while (j < css.length) {
    if (css[j] === '{') {
      // Has a block
      const bodyEnd = findMatchingBrace(css, j);
      return {
        name,
        length: bodyEnd + 1 - start,
        bodyStart: j,
        bodyEnd,
        hasBlock: true,
      };
    }
    if (css[j] === ';') {
      return {
        name,
        length: j + 1 - start,
        bodyStart: -1,
        bodyEnd: -1,
        hasBlock: false,
      };
    }
    j++;
  }

  // Unterminated — consume rest
  return { name, length: css.length - start, bodyStart: -1, bodyEnd: -1, hasBlock: false };
}

/**
 * Find the matching closing brace for an opening brace at `start`.
 */
function findMatchingBrace(css, start) {
  let depth = 1;
  let j = start + 1;
  while (j < css.length && depth > 0) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}') depth--;

    // Skip string literals
    if (css[j] === '"' || css[j] === "'") {
      const quote = css[j];
      j++;
      while (j < css.length && css[j] !== quote) {
        if (css[j] === '\\') j++; // skip escaped char
        j++;
      }
    }

    // Skip comments
    if (css[j] === '/' && css[j + 1] === '*') {
      j += 2;
      while (j < css.length && !(css[j] === '*' && css[j + 1] === '/')) j++;
      j++; // skip the /
    }

    j++;
  }
  return j - 1;
}

/**
 * Remove all scoping from a previously scoped CSS string.
 * Useful for exporting clean CSS from a manifest.
 */
export function unscopeCSS(scopedCSS, scopeId) {
  const prefix = `#${scopeId} `;
  return scopedCSS.replaceAll(prefix, '');
}
