import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import { TocItem } from '@/types';
import { slugify } from '../utils';
import { sanitizeHtml as serverSanitize } from '../sanitize';

// Configure marked with GFM heading IDs
marked.use(gfmHeadingId());

// Configure syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export interface ParseOptions {
  sanitize?: boolean;
  extractToc?: boolean;
}

export interface ParseResult {
  html: string;
  toc: TocItem[];
}

/**
 * Parses markdown content to HTML with optional sanitization and TOC extraction.
 * @param markdown - The markdown string to parse
 * @param options - Parsing options (sanitize, extractToc)
 * @returns ParseResult containing HTML and table of contents
 */
export function parseMarkdown(markdown: string, options: ParseOptions = {}): ParseResult {
  const { sanitize = true, extractToc = true } = options;

  // Extract table of contents before parsing
  const toc: TocItem[] = [];

  if (extractToc) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);

      toc.push({
        id,
        text,
        level,
      });
    }
  }

  // Parse markdown to HTML
  let html = marked.parse(markdown, { async: false }) as string;

  // Sanitize HTML to prevent XSS
  if (sanitize) {
    // Always run server-safe sanitization first
    html = serverSanitize(html);

    // Additionally run DOMPurify on the client for extra security
    if (typeof window !== 'undefined') {
      html = DOMPurify.sanitize(html, {
        ADD_TAGS: ['input'],
        ADD_ATTR: ['checked', 'disabled', 'type', 'data-math', 'data-processed'],
      });
    }
  }

  return {
    html,
    toc,
  };
}

/**
 * Converts markdown to HTML string.
 * @param markdown - The markdown string to convert
 * @returns Sanitized HTML string
 */
export function parseMarkdownToHtml(markdown: string): string {
  return parseMarkdown(markdown).html;
}

/**
 * Extracts headings from markdown for table of contents.
 * @param markdown - The markdown string to extract headings from
 * @returns Array of TocItem objects
 */
export function extractHeadings(markdown: string): TocItem[] {
  return parseMarkdown(markdown, { sanitize: false }).toc;
}

/**
 * Processes math equations in HTML for KaTeX rendering.
 * Converts $...$ (inline) and $$...$$ (block) math notation.
 * @param html - HTML string with math notation
 * @returns HTML with KaTeX placeholders
 */
export function processMath(html: string): string {
  // Block math: $$...$$ (must be processed BEFORE inline math)
  html = html.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
    return `<div class="katex-display" data-math="${encodeURIComponent(math)}"></div>`;
  });

  // Inline math: $...$ (single $ not followed by another $)
  html = html.replace(/\$([^$\n]+)\$/g, (_, math) => {
    return `<span class="katex-inline" data-math="${encodeURIComponent(math)}"></span>`;
  });

  return html;
}

/**
 * Processes mermaid diagram code blocks for rendering.
 * @param html - HTML string with mermaid code blocks
 * @returns HTML with mermaid diagram containers
 */
export function processMermaid(html: string): string {
  // Look for code blocks with mermaid language
  html = html.replace(
    /<pre><code class="hljs language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => {
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
      return `<div class="mermaid">${decodedCode}</div>`;
    }
  );

  return html;
}

// Module-level emoji map — defined once, not recreated on every call.
const emojiMap: Record<string, string> = {
  ':smile:': '😊',
  ':laughing:': '😂',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':star:': '⭐',
  ':fire:': '🔥',
  ':rocket:': '🚀',
  ':warning:': '⚠️',
  ':check:': '✅',
  ':x:': '❌',
  ':info:': 'ℹ️',
  ':bulb:': '💡',
  ':memo:': '📝',
  ':calendar:': '📅',
  ':clock:': '🕐',
  ':email:': '📧',
  ':phone:': '📞',
  ':link:': '🔗',
  ':lock:': '🔒',
  ':unlock:': '🔓',
  ':key:': '🔑',
  ':gear:': '⚙️',
  ':wrench:': '🔧',
  ':hammer:': '🔨',
  ':package:': '📦',
  ':folder:': '📁',
  ':file:': '📄',
  ':book:': '📖',
  ':bookmark:': '🔖',
  ':tag:': '🏷️',
  ':bug:': '🐛',
  ':zap:': '⚡',
  ':sparkles:': '✨',
  ':tada:': '🎉',
  ':trophy:': '🏆',
  ':medal:': '🏅',
  ':100:': '💯',
  ':thinking:': '🤔',
  ':eyes:': '👀',
  ':wave:': '👋',
  ':clap:': '👏',
  ':muscle:': '💪',
  ':pray:': '🙏',
  ':coffee:': '☕',
  ':pizza:': '🍕',
  ':cake:': '🎂',
  ':gift:': '🎁',
  ':balloon:': '🎈',
  ':art:': '🎨',
  ':music:': '🎵',
  ':video:': '📹',
  ':camera:': '📷',
  ':computer:': '💻',
  ':keyboard:': '⌨️',
  ':mouse:': '🖱️',
  ':printer:': '🖨️',
  ':cloud:': '☁️',
  ':sun:': '☀️',
  ':moon:': '🌙',
  ':rainbow:': '🌈',
  ':umbrella:': '☔',
  ':snowflake:': '❄️',
  ':earth:': '🌍',
  ':tree:': '🌳',
  ':flower:': '🌸',
  ':cat:': '🐱',
  ':dog:': '🐕',
  ':bird:': '🐦',
  ':fish:': '🐟',
  ':butterfly:': '🦋',
  ':bee:': '🐝',
  ':car:': '🚗',
  ':airplane:': '✈️',
  ':ship:': '🚢',
  ':house:': '🏠',
  ':office:': '🏢',
  ':hospital:': '🏥',
  ':school:': '🏫',
  ':bank:': '🏦',
};

// Module-level: pre-compile all emoji RegExp patterns once at startup.
// Using the 'g' flag requires resetting lastIndex before each use because
// stateful global RegExps retain their position across calls.
const compiledEmojiPatterns: Array<[RegExp, string]> = Object.entries(emojiMap).map(
  ([code, emoji]) => [
    new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    emoji,
  ]
);

/**
 * Converts emoji shortcodes to Unicode emoji characters.
 * @param html - HTML string with emoji shortcodes (e.g., :smile:)
 * @returns HTML with Unicode emoji characters
 */
export function processEmoji(html: string): string {
  let result = html;
  for (const [pattern, emoji] of compiledEmojiPatterns) {
    // Reset lastIndex so the stateful global RegExp always starts from
    // the beginning of the string, regardless of prior calls.
    pattern.lastIndex = 0;
    result = result.replace(pattern, emoji);
  }
  return result;
}

/**
 * Parses markdown with all features enabled (math, mermaid, emoji).
 * This is the main entry point for full markdown processing.
 * A final server-side sanitization pass is applied after all post-processing
 * so that any HTML introduced by processMath, processMermaid, or processEmoji
 * is also sanitized before the result is returned.
 * @param markdown - The markdown string to parse
 * @param options - Parsing options (sanitize, extractToc)
 * @returns ParseResult containing HTML and table of contents
 */
export function parseMarkdownFull(markdown: string, options: ParseOptions = {}): ParseResult {
  const { sanitize = true } = options;
  const result = parseMarkdown(markdown, options);

  // Process additional features
  result.html = processMath(result.html);
  result.html = processMermaid(result.html);
  result.html = processEmoji(result.html);

  // Apply a final server-side sanitization pass after all post-processing so
  // that HTML injected by processMath / processMermaid / processEmoji is also
  // cleaned before the result leaves this function.
  if (sanitize) {
    result.html = serverSanitize(result.html);
  }

  return result;
}
