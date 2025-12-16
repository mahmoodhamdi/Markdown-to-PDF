# Architecture Overview

This document describes the high-level architecture of the Markdown-to-PDF application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Monaco    │  │  Markdown   │  │   Zustand   │  │   Service   │   │
│  │   Editor    │  │   Preview   │  │   Stores    │  │   Worker    │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API Routes                                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ /convert │ │ /preview │ │ /themes  │ │ /health  │           │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │   │
│  │       │            │            │            │                  │   │
│  │       └────────────┴────────────┴────────────┘                  │   │
│  │                           │                                      │   │
│  └───────────────────────────┼──────────────────────────────────────┘   │
│                              │                                          │
│  ┌───────────────────────────┼──────────────────────────────────────┐   │
│  │                    Core Libraries                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │   Markdown   │  │     PDF      │  │    Theme     │           │   │
│  │  │    Parser    │  │  Generator   │  │   Manager    │           │   │
│  │  │   (marked)   │  │ (puppeteer)  │  │              │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Browser Pool                                 │   │
│  │              (Shared Puppeteer instances)                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           COMPONENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                         Layout                                   │     │
│  │  ┌──────────┐  ┌──────────────────────────────────┐  ┌───────┐ │     │
│  │  │  Header  │  │           Main Content           │  │Footer │ │     │
│  │  └──────────┘  └──────────────────────────────────┘  └───────┘ │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                      Editor Section                             │     │
│  │  ┌────────────────────────────────────────────────────────┐   │     │
│  │  │                    EditorToolbar                        │   │     │
│  │  └────────────────────────────────────────────────────────┘   │     │
│  │  ┌────────────────────────────────────────────────────────┐   │     │
│  │  │                   MarkdownEditor                        │   │     │
│  │  │                   (Monaco Editor)                       │   │     │
│  │  └────────────────────────────────────────────────────────┘   │     │
│  │  ┌────────────────────────────────────────────────────────┐   │     │
│  │  │                    EditorStats                          │   │     │
│  │  └────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                     Preview Section                             │     │
│  │  ┌────────────────────────────────────────────────────────┐   │     │
│  │  │                  TableOfContents                        │   │     │
│  │  └────────────────────────────────────────────────────────┘   │     │
│  │  ┌────────────────────────────────────────────────────────┐   │     │
│  │  │                  MarkdownPreview                        │   │     │
│  │  │   (KaTeX, Mermaid, Syntax Highlighting)                │   │     │
│  │  └────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    Converter Section                            │     │
│  │  ┌──────────────┐  ┌──────────────────────────────────────┐   │     │
│  │  │ConvertButton │  │           PageSettings               │   │     │
│  │  └──────────────┘  └──────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────▶│   Editor     │────▶│   Zustand    │
│   Input      │     │  Component   │     │    Store     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     │                            │                            │
                     ▼                            ▼                            ▼
              ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
              │   Preview    │            │    Theme     │            │    Page      │
              │   Update     │            │   Settings   │            │   Settings   │
              └──────────────┘            └──────────────┘            └──────────────┘
                     │                            │                            │
                     └────────────────────────────┼────────────────────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Convert    │
                                          │   Button     │
                                          └──────┬───────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │  API Route   │
                                          │  /convert    │
                                          └──────┬───────┘
                                                 │
                     ┌───────────────────────────┼───────────────────────────┐
                     │                           │                           │
                     ▼                           ▼                           ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │   Markdown   │           │    Theme     │           │    Page      │
              │    Parser    │           │     CSS      │           │   Settings   │
              └──────┬───────┘           └──────┬───────┘           └──────┬───────┘
                     │                          │                          │
                     └──────────────────────────┼──────────────────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │     HTML     │
                                         │   Document   │
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │  Puppeteer   │
                                         │  (Browser)   │
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │     PDF      │
                                         │    File      │
                                         └──────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ZUSTAND STORES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       editor-store                                 │  │
│  │  • content: string        • viewMode: 'editor'|'preview'|'split' │  │
│  │  • isFullscreen: boolean  • showToc: boolean                      │  │
│  │  • editorInstance         • saveStatus: SaveStatus                │  │
│  │  • insertAtCursor()       • wrapSelection()                       │  │
│  │  • undo() / redo()                                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       theme-store                                  │  │
│  │  • documentTheme: DocumentTheme                                   │  │
│  │  • codeTheme: CodeTheme                                           │  │
│  │  • mode: 'light' | 'dark' | 'system'                              │  │
│  │  • customCss: string                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      settings-store                                │  │
│  │  • editorSettings: EditorSettings                                 │  │
│  │  • defaultPageSize: PageSize                                      │  │
│  │  • defaultOrientation: Orientation                                │  │
│  │  • defaultDocumentTheme: string                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  All stores use persist middleware → localStorage                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/convert` | POST | Convert markdown to PDF |
| `/api/convert/batch` | POST | Batch convert multiple files |
| `/api/preview` | POST | Generate HTML preview |
| `/api/themes` | GET | List available themes |
| `/api/templates` | GET | List document templates |
| `/api/health` | GET | Health check endpoint |

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| UI Components | Radix UI |
| Editor | Monaco Editor |
| PDF Generation | Puppeteer |
| Markdown | Marked |
| Math | KaTeX |
| Diagrams | Mermaid |
| Code Highlighting | highlight.js |
| Testing | Vitest, Playwright |
| i18n | next-intl |

## File Structure

```
src/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalized pages
│   │   ├── page.tsx         # Home page
│   │   ├── templates/       # Templates page
│   │   ├── themes/          # Themes page
│   │   ├── batch/           # Batch conversion page
│   │   ├── settings/        # Settings page
│   │   └── api-docs/        # API documentation page
│   └── api/                 # API routes
│       ├── convert/         # PDF conversion
│       ├── preview/         # HTML preview
│       ├── themes/          # Theme listing
│       ├── templates/       # Template listing
│       └── health/          # Health check
├── components/              # React components
│   ├── editor/             # Editor components
│   ├── preview/            # Preview components
│   ├── converter/          # Conversion components
│   ├── layout/             # Layout components
│   └── ui/                 # UI primitives
├── lib/                    # Core libraries
│   ├── markdown/           # Markdown processing
│   ├── pdf/               # PDF generation
│   └── themes/            # Theme management
├── stores/                # Zustand stores
├── types/                 # TypeScript definitions
├── hooks/                 # Custom React hooks
├── i18n/                  # i18n configuration
└── messages/              # Translation files
```

## Performance Optimizations

1. **Browser Pool**: Reuses Puppeteer browser instances
2. **Debounced Preview**: 300ms debounce on preview updates
3. **Service Worker**: Caches static assets offline
4. **Lazy Loading**: Dynamic imports for heavy dependencies
5. **Memoization**: useMemo for expensive computations
