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

export function parseMarkdownToHtml(markdown: string): string {
  return parseMarkdown(markdown).html;
}

export function extractHeadings(markdown: string): TocItem[] {
  return parseMarkdown(markdown, { sanitize: false }).toc;
}

// Process math equations (KaTeX)
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

// Process mermaid diagrams
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

// Process emoji shortcodes
export function processEmoji(html: string): string {
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

  Object.entries(emojiMap).forEach(([code, emoji]) => {
    html = html.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
  });

  return html;
}

// Full parse with all features
export function parseMarkdownFull(markdown: string): ParseResult {
  const result = parseMarkdown(markdown);

  // Process additional features
  result.html = processMath(result.html);
  result.html = processMermaid(result.html);
  result.html = processEmoji(result.html);

  return result;
}
