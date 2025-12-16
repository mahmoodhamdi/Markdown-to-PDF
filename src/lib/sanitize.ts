/**
 * Server-safe HTML sanitization utilities
 * These functions work on both client and server side
 */

// Dangerous tags that should be completely removed
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'base',
  'meta',
  'link',
  'style',
  'noscript',
];

// Dangerous attributes that should be removed
const DANGEROUS_ATTRS = [
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'onmouseenter',
  'onmouseleave',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onreset',
  'onselect',
  'oninput',
  'onload',
  'onerror',
  'onabort',
  'onresize',
  'onscroll',
  'onunload',
  'onbeforeunload',
  'onhashchange',
  'onpopstate',
  'onstorage',
  'onoffline',
  'ononline',
  'onmessage',
  'onanimationstart',
  'onanimationend',
  'onanimationiteration',
  'ontransitionend',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'oncontextmenu',
  'oncopy',
  'oncut',
  'onpaste',
  'formaction',
  'xlink:href',
];

// Safe attributes for specific tags (reserved for future allowlist implementation)
const _SAFE_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  input: ['type', 'checked', 'disabled'],
  div: ['class', 'id', 'data-math', 'data-processed'],
  span: ['class', 'id', 'data-math'],
  pre: ['class'],
  code: ['class'],
  table: ['class'],
  th: ['class', 'scope'],
  td: ['class', 'colspan', 'rowspan'],
  '*': ['class', 'id', 'data-testid'],
};

/**
 * Remove dangerous HTML tags
 */
function removeDangerousTags(html: string): string {
  let result = html;

  for (const tag of DANGEROUS_TAGS) {
    // Remove opening and closing tags with content
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    result = result.replace(regex, '');

    // Remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    result = result.replace(selfClosingRegex, '');
  }

  return result;
}

/**
 * Remove dangerous attributes from HTML
 */
function removeDangerousAttributes(html: string): string {
  let result = html;

  for (const attr of DANGEROUS_ATTRS) {
    // Match attribute with value in quotes
    const doubleQuoteRegex = new RegExp(`\\s${attr}\\s*=\\s*"[^"]*"`, 'gi');
    const singleQuoteRegex = new RegExp(`\\s${attr}\\s*=\\s*'[^']*'`, 'gi');
    // Match attribute with unquoted value
    const unquotedRegex = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]+`, 'gi');
    // Match attribute without value
    const noValueRegex = new RegExp(`\\s${attr}(?=\\s|>|\\/)`, 'gi');

    result = result.replace(doubleQuoteRegex, '');
    result = result.replace(singleQuoteRegex, '');
    result = result.replace(unquotedRegex, '');
    result = result.replace(noValueRegex, '');
  }

  // Remove javascript: and data: URLs in href and src
  result = result.replace(/href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, 'href="#"');
  result = result.replace(/href\s*=\s*["']?\s*data:[^"'>\s]*/gi, 'href="#"');
  result = result.replace(/src\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, 'src=""');
  result = result.replace(/src\s*=\s*["']?\s*data:(?!image\/)[^"'>\s]*/gi, 'src=""');

  return result;
}

/**
 * Remove HTML comments (could contain conditional IE hacks)
 */
function removeComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Server-safe HTML sanitizer
 * Works on both client and server
 */
export function sanitizeHtml(html: string): string {
  let result = html;

  // Remove comments first
  result = removeComments(result);

  // Remove dangerous tags
  result = removeDangerousTags(result);

  // Remove dangerous attributes
  result = removeDangerousAttributes(result);

  return result;
}

/**
 * Sanitize CSS to prevent injection attacks
 * Removes potentially dangerous CSS constructs
 */
export function sanitizeCss(css: string): string {
  let result = css;

  // Remove @import rules (could load external resources)
  result = result.replace(/@import\s+[^;]+;?/gi, '');

  // Remove url() with javascript or data (except images)
  result = result.replace(/url\s*\(\s*["']?\s*javascript:[^)]*\)/gi, 'url()');
  result = result.replace(/url\s*\(\s*["']?\s*data:(?!image\/)[^)]*\)/gi, 'url()');

  // Remove expression() (IE specific XSS vector)
  result = result.replace(/expression\s*\([^)]*\)/gi, '');

  // Remove -moz-binding (Firefox XSS vector)
  result = result.replace(/-moz-binding\s*:[^;]+;?/gi, '');

  // Remove behavior (IE XSS vector)
  result = result.replace(/behavior\s*:[^;]+;?/gi, '');

  // Remove @charset (prevent encoding attacks)
  result = result.replace(/@charset\s+[^;]+;?/gi, '');

  return result;
}

/**
 * Sanitize text for use in CSS content or watermark
 * Escapes special characters
 */
export function sanitizeTextForCss(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\n/g, '\\A ')
    .replace(/\r/g, '');
}

/**
 * Validate and sanitize watermark text
 */
export function sanitizeWatermarkText(text: string): string {
  // Remove any HTML tags
  let result = text.replace(/<[^>]*>/g, '');

  // Limit length
  result = result.substring(0, 100);

  // Escape for CSS
  result = sanitizeTextForCss(result);

  return result;
}
