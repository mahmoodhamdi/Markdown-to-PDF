# Markdown to PDF Converter

A production-ready Markdown to PDF converter web application built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- Live Preview - See changes in real-time as you type
- 5 Document Themes - GitHub, Academic, Minimal, Dark, Professional
- Syntax Highlighting - Support for 20+ programming languages
- Math Equations - LaTeX/KaTeX support
- Mermaid Diagrams - Flowcharts, sequence diagrams, and more
- Batch Conversion - Convert multiple files at once
- Bilingual Support - English and Arabic with full RTL support
- Responsive Design - Works on mobile, tablet, and desktop
- Docker Support - Easy deployment with Docker
- REST API - Programmatic access to conversion features

## Quick Start

### Using Docker

```bash
docker pull mwmsoftware/markdown-to-pdf:latest
docker run -p 3000:3000 mwmsoftware/markdown-to-pdf
```

### Manual Installation

```bash
git clone https://github.com/mahmoodhamdi/Markdown-to-PDF.git
cd Markdown-to-PDF
npm install
npm run dev
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Monaco Editor
- marked + highlight.js
- Puppeteer
- KaTeX
- Mermaid
- Zustand
- next-intl
- Vitest + Playwright

## API

### Convert to PDF

```bash
POST /api/convert
Content-Type: application/json

{
  "markdown": "# Hello World",
  "theme": "github"
}
```

### Generate Preview

```bash
POST /api/preview
Content-Type: application/json

{
  "markdown": "# Hello World"
}
```

## Testing

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## License

MIT

---

Made with love by mahmoodhamdi
