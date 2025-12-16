# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000

# Build
npm run build            # Production build

# Lint
npm run lint             # ESLint check

# Testing
npm run test             # Run Vitest (watch mode)
npm run test:unit        # Run unit tests (__tests__/unit/**)
npm run test:integration # Run integration tests (__tests__/integration/**)
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:coverage    # Coverage report

# Docker
docker build -f docker/Dockerfile -t markdown-to-pdf .
docker-compose -f docker/docker-compose.yml up
```

## Architecture Overview

### Core Processing Pipeline

1. **Markdown Parser** (`src/lib/markdown/parser.ts`): Converts markdown to HTML using `marked` with extensions for GFM, syntax highlighting (highlight.js), KaTeX math, Mermaid diagrams, and emoji shortcodes. All parsing flows through `parseMarkdownFull()`.

2. **PDF Generator** (`src/lib/pdf/generator.ts`): Uses Puppeteer to render HTML and generate PDFs. `generateHtmlDocument()` creates the full HTML with theme CSS, KaTeX/Mermaid scripts. `generatePdf()` launches headless Chrome for conversion.

3. **Theme Manager** (`src/lib/themes/manager.ts`): Manages 5 document themes (github, academic, minimal, dark, professional) and 7 code themes. CSS is embedded directly in the file to avoid import issues.

### State Management (Zustand)

- `editor-store.ts`: Editor content, view mode (editor/preview/split), fullscreen state
- `theme-store.ts`: Document theme, code theme, UI theme mode
- `settings-store.ts`: Page settings (size, orientation, margins, watermark, headers/footers)

All stores use `persist` middleware to save to localStorage.

### Internationalization

- Uses `next-intl` with locale routing (`src/i18n/`)
- Supported locales: `en`, `ar` (with RTL support)
- Translation files: `src/messages/{en,ar}.json`
- Routes are prefixed with locale: `/en/`, `/ar/`

### API Routes

All routes in `src/app/api/`:
- `POST /api/convert` - Main PDF conversion endpoint
- `POST /api/convert/batch` - Batch conversion (multiple files)
- `POST /api/preview` - HTML preview generation
- `GET /api/themes` - Available themes
- `GET /api/templates` - Document templates
- `GET /api/health` - Health check

### Type Definitions

Core types in `src/types/index.ts`:
- `DocumentTheme`, `CodeTheme` - Theme enums
- `PageSettings`, `PageMargins`, `Watermark` - PDF configuration
- `ConversionOptions`, `ConversionResult` - API contracts
- `Template`, `BatchFile` - Feature-specific types

### Component Structure

- `components/editor/` - Monaco editor, toolbar, file upload
- `components/preview/` - Markdown preview, table of contents
- `components/converter/` - Convert button, page settings dialog
- `components/layout/` - Header, footer, theme toggle, language switcher
- `components/ui/` - Radix UI primitives (button, select, tabs, etc.)

### Path Alias

`@/` maps to `./src/` (configured in tsconfig.json and vitest configs)

## Testing Structure

- Unit tests: `__tests__/unit/` - Test utilities and pure functions
- Integration tests: `__tests__/integration/` - API route testing
- E2E tests: `__tests__/e2e/` - Playwright browser tests
- Test setup: `src/test/setup.ts` - jsdom environment with testing-library
