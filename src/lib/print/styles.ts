/**
 * Print Styles Utility
 * Provides CSS styles for printing documents
 */

/**
 * Get base print styles for documents
 * These styles ensure consistent printing across browsers
 */
export function getPrintStyles(): string {
  return `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: black;
      background: white;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }

    /* Headings */
    h1 { font-size: 24pt; margin-top: 24pt; margin-bottom: 12pt; }
    h2 { font-size: 20pt; margin-top: 20pt; margin-bottom: 10pt; }
    h3 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; }
    h4 { font-size: 14pt; margin-top: 14pt; margin-bottom: 7pt; }
    h5 { font-size: 12pt; margin-top: 12pt; margin-bottom: 6pt; }
    h6 { font-size: 11pt; margin-top: 11pt; margin-bottom: 5pt; }

    /* Paragraphs */
    p {
      margin-bottom: 12pt;
    }

    /* Code */
    pre, code {
      font-family: 'Courier New', Consolas, monospace;
      font-size: 10pt;
      background: #f5f5f5;
    }

    code {
      padding: 2pt 4pt;
      border-radius: 3pt;
    }

    pre {
      padding: 12pt;
      border: 1pt solid #ddd;
      border-radius: 4pt;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    pre code {
      padding: 0;
      background: transparent;
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }

    th, td {
      border: 1pt solid #ddd;
      padding: 8pt 12pt;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
    }

    /* Blockquotes */
    blockquote {
      border-left: 3pt solid #ddd;
      margin: 12pt 0;
      padding-left: 12pt;
      color: #555;
      font-style: italic;
    }

    /* Lists */
    ul, ol {
      margin: 12pt 0;
      padding-left: 24pt;
    }

    li {
      margin-bottom: 4pt;
    }

    /* Horizontal rule */
    hr {
      border: none;
      border-top: 1pt solid #ddd;
      margin: 24pt 0;
    }

    /* Links - show URL in print */
    a {
      color: #0066cc;
      text-decoration: underline;
    }

    /* Page break handling */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    p, li, blockquote {
      orphans: 3;
      widows: 3;
    }

    pre, code, table, img {
      page-break-inside: avoid;
    }

    /* Task lists */
    .task-list-item {
      list-style: none;
      margin-left: -24pt;
      padding-left: 24pt;
    }

    .task-list-item input[type="checkbox"] {
      margin-right: 8pt;
    }

    /* KaTeX math */
    .katex {
      font-size: 1em;
    }

    /* Mermaid diagrams */
    .mermaid {
      text-align: center;
      margin: 12pt 0;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
    }
  `;
}

/**
 * Get print page settings CSS
 */
export function getPrintPageSettings(options?: {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
}): string {
  const {
    marginTop = '1in',
    marginBottom = '1in',
    marginLeft = '1in',
    marginRight = '1in',
  } = options || {};

  return `
    @page {
      margin-top: ${marginTop};
      margin-bottom: ${marginBottom};
      margin-left: ${marginLeft};
      margin-right: ${marginRight};
    }
  `;
}

/**
 * Wrap content in a complete HTML document for printing
 */
export function createPrintDocument(
  content: string,
  title: string = 'Document',
  additionalStyles: string = ''
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${getPrintStyles()}
          ${getPrintPageSettings()}
          ${additionalStyles}
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
}
