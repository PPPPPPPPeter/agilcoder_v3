/**
 * css-patcher.js
 * 
 * Surgical CSS string mutations. Allows modifying individual
 * property values within selector blocks, appending new rules,
 * removing rules, and replacing entire blocks.
 * 
 * Used by PatchEngine to handle the extended "css" op type.
 * 
 * Pure string manipulation — no DOM, no dependencies.
 */

/**
 * Apply a CSS patch to a raw CSS string.
 * 
 * Patch shapes:
 *   { selector, property, value }       → replace one property value
 *   { action: "append", rule }          → append a new CSS rule
 *   { action: "prepend", rule }         → prepend a new CSS rule
 *   { action: "remove-rule", selector } → remove entire rule block
 *   { action: "replace-block", selector, block } → replace entire block body
 *   { action: "upsert", selector, property, value } → set property; create rule if missing
 * 
 * @param {string} css   — the manifest's css string
 * @param {object} patch — the CSS-specific patch data
 * @returns {string}     — updated CSS string
 */
export function applyCSSPatch(css, patch) {
  // Action-based patches
  if (patch.action) {
    switch (patch.action) {
      case 'append':
        return css.trimEnd() + '\n' + patch.rule;

      case 'prepend':
        return patch.rule + '\n' + css;

      case 'remove-rule':
        return removeRule(css, patch.selector);

      case 'replace-block':
        return replaceBlock(css, patch.selector, patch.block);

      case 'upsert':
        return upsertProperty(css, patch.selector, patch.property, patch.value);

      default:
        throw new Error(`Unknown CSS patch action: "${patch.action}"`);
    }
  }

  // Default: replace a property value within a selector block
  if (patch.selector && patch.property && patch.value !== undefined) {
    return replaceProperty(css, patch.selector, patch.property, patch.value);
  }

  throw new Error('Invalid CSS patch: need either {action, ...} or {selector, property, value}');
}

// ─── Core Operations ───────────────────────────────────────────────

/**
 * Replace a single property value within a specific selector's block.
 * If the property doesn't exist in the block, it's added.
 */
function replaceProperty(css, selector, property, value) {
  const blockInfo = findRuleBlock(css, selector);
  if (!blockInfo) {
    // Selector doesn't exist — append as new rule
    return css.trimEnd() + `\n${selector} { ${property}: ${value}; }`;
  }

  const { bodyStart, bodyEnd } = blockInfo;
  const body = css.slice(bodyStart, bodyEnd);

  // Try to find and replace the property
  const propRegex = new RegExp(
    '(' + escapeRegex(property) + '\\s*:\\s*)([^;!}]+)(\\s*(?:![^;]*)?;?)',
    ''
  );

  if (propRegex.test(body)) {
    const newBody = body.replace(propRegex, `$1${value}$3`);
    return css.slice(0, bodyStart) + newBody + css.slice(bodyEnd);
  }

  // Property not found in block — add it
  const newBody = body.trimEnd() + ` ${property}: ${value};`;
  return css.slice(0, bodyStart) + newBody + css.slice(bodyEnd);
}

/**
 * Remove an entire rule block by selector.
 */
function removeRule(css, selector) {
  const blockInfo = findRuleBlock(css, selector);
  if (!blockInfo) return css; // nothing to remove

  // Remove from selector start to closing brace + 1
  const before = css.slice(0, blockInfo.ruleStart).trimEnd();
  const after = css.slice(blockInfo.ruleEnd + 1).trimStart();
  return before + (before && after ? '\n' : '') + after;
}

/**
 * Replace the entire body of a rule block (keeping the selector).
 */
function replaceBlock(css, selector, newBlock) {
  const blockInfo = findRuleBlock(css, selector);
  if (!blockInfo) {
    // Doesn't exist — create it
    return css.trimEnd() + `\n${selector} { ${newBlock} }`;
  }

  return css.slice(0, blockInfo.bodyStart) + ' ' + newBlock + ' ' + css.slice(blockInfo.bodyEnd);
}

/**
 * Upsert: set a property value, creating the rule if it doesn't exist.
 */
function upsertProperty(css, selector, property, value) {
  // replaceProperty already handles both cases (existing + new)
  return replaceProperty(css, selector, property, value);
}

// ─── Block Finder ──────────────────────────────────────────────────

/**
 * Find a rule block by its exact selector string.
 * Returns { ruleStart, bodyStart, bodyEnd, ruleEnd } or null.
 * 
 * ruleStart: index of first char of selector
 * bodyStart: index of first char inside { }
 * bodyEnd:   index of last char inside { } (before })
 * ruleEnd:   index of }
 */
function findRuleBlock(css, selector) {
  const escaped = escapeRegex(selector.trim());
  // Match the selector followed by optional whitespace and {
  const selectorRegex = new RegExp('(^|[;{}\\n])\\s*(' + escaped + ')\\s*\\{', 'g');

  let match;
  while ((match = selectorRegex.exec(css)) !== null) {
    const selectorStart = match.index + match[1].length;
    const openBrace = css.indexOf('{', selectorStart);
    if (openBrace === -1) continue;

    const closeBrace = findClosingBrace(css, openBrace);
    if (closeBrace === -1) continue;

    return {
      ruleStart: selectorStart,
      bodyStart: openBrace + 1,
      bodyEnd: closeBrace,
      ruleEnd: closeBrace,
    };
  }

  return null;
}

function findClosingBrace(css, openPos) {
  let depth = 1;
  let j = openPos + 1;
  while (j < css.length && depth > 0) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}') depth--;
    if (depth > 0) j++;
  }
  return depth === 0 ? j : -1;
}

// ─── Utilities ─────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract all selectors from a CSS string (for introspection).
 */
export function extractSelectors(css) {
  const selectors = [];
  // Split into rule chunks by finding each { and looking backwards for the selector
  let depth = 0;
  let blockStart = -1;

  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) {
        // Find the selector: scan backwards from { to previous } or ; or start
        let j = i - 1;
        while (j >= 0 && css[j] !== '}' && css[j] !== ';') j--;
        const sel = css.slice(j + 1, i).trim();
        if (sel && !sel.startsWith('@') && !sel.startsWith('/*') && !/^(from|to|\d+%)$/.test(sel)) {
          const parts = sel.split(',').map(s => s.trim()).filter(Boolean);
          selectors.push(...parts);
        }
      }
      depth++;
    } else if (css[i] === '}') {
      depth--;
    }
  }

  return [...new Set(selectors)];
}

/**
 * Extract all properties from a specific selector's block.
 * Returns Record<property, value>.
 */
export function extractProperties(css, selector) {
  const blockInfo = findRuleBlock(css, selector);
  if (!blockInfo) return {};

  const body = css.slice(blockInfo.bodyStart, blockInfo.bodyEnd);
  const props = {};
  const propRegex = /([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = propRegex.exec(body)) !== null) {
    props[match[1].trim()] = match[2].trim();
  }
  return props;
}

/**
 * Extract section labels from CSS comments like /* [color-palette] *​/
 */
export function extractSectionLabels(css) {
  const labels = [];
  const regex = /\/\*\s*\[([^\]]+)\]\s*\*\//g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    labels.push(match[1].trim());
  }
  return labels;
}
