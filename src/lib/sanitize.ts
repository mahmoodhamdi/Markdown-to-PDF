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

// Safe attributes for specific tags (exported for potential allowlist implementation)
export const SAFE_ATTRS: Record<string, string[]> = {
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

/**
 * Sanitize filename to prevent path traversal and injection attacks
 * Safe for use in storage paths and downloads
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  let result = filename;

  // Remove path traversal sequences
  result = result.replace(/\.\./g, '');

  // Remove directory separators
  result = result.replace(/[/\\]/g, '_');

  // Remove null bytes and control characters
  result = result.replace(/[\x00-\x1f]/g, '');

  // Remove characters that are problematic on various filesystems
  // Windows: < > : " / \ | ? *
  // Also remove characters that could cause issues in URLs or shell commands
  result = result.replace(/[<>:"|?*`${}[\]()!#&;]/g, '_');

  // Remove leading/trailing dots and spaces (Windows issue)
  result = result.replace(/^[.\s]+|[.\s]+$/g, '');

  // Collapse multiple underscores
  result = result.replace(/_+/g, '_');

  // Ensure filename is not empty after sanitization
  if (!result) {
    return 'unnamed';
  }

  // Limit length (255 is common filesystem limit)
  if (result.length > 200) {
    // Preserve extension if present
    const extMatch = result.match(/\.[a-zA-Z0-9]{1,10}$/);
    if (extMatch) {
      const ext = extMatch[0];
      result = result.substring(0, 200 - ext.length) + ext;
    } else {
      result = result.substring(0, 200);
    }
  }

  // Block certain reserved names on Windows
  const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (reserved.test(result.replace(/\.[^.]*$/, ''))) {
    result = '_' + result;
  }

  return result;
}

/**
 * Sanitize path component (single directory or filename)
 * More restrictive than sanitizeFilename
 */
export function sanitizePathComponent(component: string): string {
  if (!component || typeof component !== 'string') {
    return 'unnamed';
  }

  // Only allow alphanumeric, hyphen, underscore, and dot
  let result = component.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove leading dots
  result = result.replace(/^\.+/, '');

  // Collapse multiple underscores/dots
  result = result.replace(/[_.]+/g, (match) => match[0]);

  return result || 'unnamed';
}

/**
 * Validate and sanitize a complete file path
 * Returns null if the path is suspicious
 */
export function validateFilePath(path: string, allowedBasePath?: string): string | null {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/');

  // Check for path traversal attempts
  if (normalizedPath.includes('..')) {
    return null;
  }

  // Check for null bytes
  if (normalizedPath.includes('\x00')) {
    return null;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\/\//, // Double slashes
    /^\s|\s$/, // Leading/trailing whitespace
    /%[0-9a-f]{2}/i, // URL encoded characters
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(normalizedPath)) {
      return null;
    }
  }

  // If base path is specified, ensure the path starts with it
  if (allowedBasePath) {
    const normalizedBase = allowedBasePath.replace(/\\/g, '/').replace(/\/$/, '');
    if (!normalizedPath.startsWith(normalizedBase + '/') && normalizedPath !== normalizedBase) {
      return null;
    }
  }

  return normalizedPath;
}
