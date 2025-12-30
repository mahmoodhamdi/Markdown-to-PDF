import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  parseMarkdownToHtml,
  extractHeadings,
  processMath,
  processMermaid,
  processEmoji,
} from '@/lib/markdown/parser';

describe('Markdown Parser', () => {
  describe('parseMarkdown', () => {
    it('should parse basic markdown to HTML', () => {
      const result = parseMarkdown('# Hello World');
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('Hello World');
    });

    it('should parse bold text', () => {
      const result = parseMarkdown('**bold text**');
      expect(result.html).toContain('<strong>bold text</strong>');
    });

    it('should parse italic text', () => {
      const result = parseMarkdown('_italic text_');
      expect(result.html).toContain('<em>italic text</em>');
    });

    it('should parse code blocks', () => {
      const result = parseMarkdown('```javascript\nconst x = 1;\n```');
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('<code');
    });

    it('should parse links', () => {
      const result = parseMarkdown('[Link](https://example.com)');
      expect(result.html).toContain('<a');
      expect(result.html).toContain('href="https://example.com"');
      expect(result.html).toContain('Link');
    });

    it('should parse images', () => {
      const result = parseMarkdown('![Alt text](image.png)');
      expect(result.html).toContain('<img');
      expect(result.html).toContain('src="image.png"');
    });

    it('should parse bullet lists', () => {
      const result = parseMarkdown('- Item 1\n- Item 2');
      expect(result.html).toContain('<ul');
      expect(result.html).toContain('<li');
    });

    it('should parse numbered lists', () => {
      const result = parseMarkdown('1. Item 1\n2. Item 2');
      expect(result.html).toContain('<ol');
      expect(result.html).toContain('<li');
    });

    it('should parse blockquotes', () => {
      const result = parseMarkdown('> Quote text');
      expect(result.html).toContain('<blockquote>');
    });

    it('should parse horizontal rules', () => {
      const result = parseMarkdown('---');
      expect(result.html).toContain('<hr');
    });

    it('should parse tables', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const result = parseMarkdown(markdown);
      expect(result.html).toContain('<table>');
      expect(result.html).toContain('<th>');
      expect(result.html).toContain('<td>');
    });

    it('should extract table of contents', () => {
      const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
      const result = parseMarkdown(markdown);
      expect(result.toc).toHaveLength(3);
      expect(result.toc[0].text).toBe('Heading 1');
      expect(result.toc[0].level).toBe(1);
      expect(result.toc[1].level).toBe(2);
      expect(result.toc[2].level).toBe(3);
    });

    it('should handle empty content', () => {
      const result = parseMarkdown('');
      expect(result.html).toBe('');
      expect(result.toc).toHaveLength(0);
    });
  });

  describe('parseMarkdownToHtml', () => {
    it('should return just HTML string', () => {
      const html = parseMarkdownToHtml('# Hello');
      expect(typeof html).toBe('string');
      expect(html).toContain('<h1');
    });
  });

  describe('extractHeadings', () => {
    it('should extract all headings', () => {
      const markdown = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      const headings = extractHeadings(markdown);
      expect(headings).toHaveLength(6);
    });

    it('should return empty array for no headings', () => {
      const headings = extractHeadings('Just some text');
      expect(headings).toHaveLength(0);
    });
  });

  describe('processMath', () => {
    it('should process inline math', () => {
      const html = '<p>The equation $E = mc^2$ is famous.</p>';
      const result = processMath(html);
      expect(result).toContain('katex-inline');
      expect(result).toContain('data-math');
    });

    it('should process block math', () => {
      const html = '<p>$$\\sum_{i=1}^n i^2$$</p>';
      const result = processMath(html);
      expect(result).toContain('katex-display');
    });

    it('should not process regular dollar signs', () => {
      const html = '<p>Price is $100</p>';
      const result = processMath(html);
      expect(result).toBe(html);
    });
  });

  describe('processMermaid', () => {
    it('should convert mermaid code blocks', () => {
      const html = '<pre><code class="hljs language-mermaid">graph TD\nA-->B</code></pre>';
      const result = processMermaid(html);
      expect(result).toContain('<div class="mermaid">');
      expect(result).not.toContain('<pre>');
    });
  });

  describe('processEmoji', () => {
    it('should convert emoji shortcodes', () => {
      const html = '<p>Hello :smile: World :heart:</p>';
      const result = processEmoji(html);
      expect(result).toContain('😊');
      expect(result).toContain('❤️');
    });

    it('should not affect text without emoji', () => {
      const html = '<p>Hello World</p>';
      const result = processEmoji(html);
      expect(result).toBe(html);
    });
  });
});
