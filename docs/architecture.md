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

### Core Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/convert` | POST | Convert markdown to PDF |
| `/api/convert/batch` | POST | Batch convert multiple files |
| `/api/preview` | POST | Generate HTML preview |
| `/api/themes` | GET | List available themes |
| `/api/templates` | GET | List document templates |
| `/api/health` | GET | Health check endpoint |

### Payment Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/checkout` | POST | Create checkout session (multi-gateway) |
| `/api/checkout` | GET | Get available payment gateways |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |
| `/api/webhooks/paymob` | POST | Paymob webhook handler |
| `/api/webhooks/paytabs` | POST | PayTabs webhook handler |
| `/api/webhooks/paddle` | POST | Paddle webhook handler |

### Storage Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/storage/upload` | POST | Upload file |
| `/api/storage/files` | GET | List user files |
| `/api/storage/files/[id]` | GET/DELETE | Get or delete file |
| `/api/storage/quota` | GET | Get storage quota |

### Team Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/teams` | POST/GET | Create/list teams |
| `/api/teams/[id]` | GET/PATCH/DELETE | Manage team |
| `/api/teams/[id]/members` | POST/GET | Manage members |

### Analytics Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/analytics/track` | POST | Track usage event |
| `/api/analytics/summary` | GET | Get usage summary |
| `/api/analytics/history` | GET | Get usage history |

### SSO Routes (Enterprise)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/sso/config` | POST/GET | Manage SSO configurations |
| `/api/sso/check` | GET | Check SSO for email domain |
| `/api/sso/domains` | POST/GET | Manage SSO domains |
| `/api/sso/metadata` | GET | Get SAML SP metadata |

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
| Testing | Vitest, Playwright (709 tests) |
| i18n | next-intl |
| Database | MongoDB (Mongoose) |
| Storage | Firebase Storage |
| Authentication | NextAuth.js |
| Payments | Stripe, Paymob, PayTabs, Paddle |

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
│       ├── checkout/        # Payment checkout
│       ├── webhooks/        # Payment webhooks (Stripe, Paymob, PayTabs, Paddle)
│       ├── storage/         # Cloud storage
│       ├── teams/           # Team management
│       ├── analytics/       # Usage analytics
│       ├── sso/             # Enterprise SSO
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
│   ├── themes/            # Theme management
│   ├── payments/          # Multi-gateway payments
│   │   ├── stripe/        # Stripe gateway
│   │   ├── paymob/        # Paymob gateway (Egypt)
│   │   ├── paytabs/       # PayTabs gateway (MENA)
│   │   └── paddle/        # Paddle gateway (MoR)
│   ├── storage/           # Cloud storage service
│   ├── teams/             # Team management
│   ├── analytics/         # Usage analytics
│   ├── sso/               # SSO/SAML service
│   ├── db/                # MongoDB models & connection
│   └── plans/             # Pricing & rate limiting
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
