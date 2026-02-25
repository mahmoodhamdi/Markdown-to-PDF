# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000

# Build
npm run build            # Production build (standalone output)
npm run analyze          # Bundle analysis (opens report in browser)

# Lint & Format
npm run lint             # ESLint check
npm run format           # Prettier format all files
npm run format:check     # Check formatting without changes

# Testing
npm run test             # Run Vitest (watch mode)
npm run test:unit        # Run unit tests (__tests__/unit/**)
npm run test:integration # Run integration tests (__tests__/integration/**), 30s timeout
npm run test:e2e         # Run Playwright E2E tests (Chromium, Firefox, WebKit)
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:coverage    # Coverage report

# Run a single test file
npx vitest run __tests__/unit/lib/utils.test.ts
npx vitest run __tests__/unit/lib/utils.test.ts -t "test name"  # Run specific test

# Database (MongoDB via Docker)
npm run db:start          # Start MongoDB container (docker-compose.dev.yml)
npm run db:stop           # Stop MongoDB container
npm run db:seed           # Seed database with sample data

# Docker
docker-compose -f docker/docker-compose.yml up          # Start app with Docker
docker-compose -f docker/docker-compose.prod.yml up     # Production mode
```

## Code Style Conventions

**Prettier**: Single quotes, 2-space indent, 100 char line width, trailing commas (ES5), double quotes in JSX, always parens on arrow functions.

**ESLint rules to know**:

- Prefix unused variables/parameters with `_` (e.g., `_req`, `_unused`) — the `@typescript-eslint/no-unused-vars` rule allows this pattern
- `no-console`: Only `console.info`, `console.warn`, `console.error` are allowed — `console.log` and `console.debug` trigger warnings
- `@typescript-eslint/no-explicit-any` is a warning, not an error
- `eqeqeq` enforced (use `===`), except for null checks

**Class names**: Use the `cn()` utility from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for conditional/merged Tailwind classes.

## Architecture Overview

**Next.js 14 App Router** application that converts Markdown to PDF. Uses `next-intl` for i18n with locale-prefixed routes (`/en/`, `/ar/` with RTL support). Middleware at `src/middleware.ts` handles locale routing.

### Locale Routing and i18n

All pages live under `src/app/[locale]/` — there is no root `layout.tsx` at `src/app/`. The locale layout (`src/app/[locale]/layout.tsx`) sets `<html lang>` and `dir` (ltr/rtl), and wraps the app in `NextIntlClientProvider`.

- **Supported locales**: `en` (English, LTR), `ar` (Arabic, RTL) — defined in `src/i18n/config.ts`
- **Translation messages**: `src/messages/en.json` and `src/messages/ar.json`
- **Routing config**: `src/i18n/routing.ts` — uses `next-intl/routing` with shared pathnames
- **Middleware matcher**: `['/', '/(en|ar)/:path*']`
- When adding a new page, create it under `src/app/[locale]/`. When adding new UI strings, add keys to both `en.json` and `ar.json`.

### Core Processing Pipeline

1. **Markdown Parser** (`src/lib/markdown/parser.ts`): Converts markdown to HTML using `marked` with extensions for GFM, syntax highlighting (highlight.js), KaTeX math, Mermaid diagrams, and emoji shortcodes. All parsing flows through `parseMarkdownFull()`.

2. **PDF Generator** (`src/lib/pdf/generator.ts`): Uses Puppeteer to render HTML and generate PDFs. `generateHtmlDocument()` creates the full HTML with theme CSS, KaTeX/Mermaid scripts. `generatePdf()` launches headless Chrome for conversion. Puppeteer is listed in `serverComponentsExternalPackages` in `next.config.js`. In Docker, Chromium is installed at `/usr/bin/chromium-browser` via `PUPPETEER_EXECUTABLE_PATH`.

3. **Theme Manager** (`src/lib/themes/manager.ts`): Manages 8 document themes (github, academic, minimal, dark, professional, elegant, modern, newsletter) and 7 code themes. CSS is embedded directly in the file to avoid import issues.

### UI Components

Components in `src/components/ui/` are Radix UI primitives styled with Tailwind CSS (shadcn/ui pattern). The editor uses Monaco Editor (`@monaco-editor/react`). Dark mode uses Tailwind's `class` strategy with CSS custom properties defined in `src/app/globals.css`.

### Freemium Plan System

Plans defined in `src/lib/plans/config.ts` with four tiers: `free`, `pro`, `team`, `enterprise`. Each plan has limits for daily conversions, API calls, file size, batch files, themes, storage quota, team seats, and custom CSS/headers/footers.

Key modules:
- `src/lib/plans/usage.ts` - Track daily usage against limits
- `src/lib/plans/rate-limit.ts` - Plan-aware rate limiting
- `src/lib/stripe/` - Stripe checkout and webhook handling

### Backend Services (MongoDB + Firebase Storage)

Database uses MongoDB with Mongoose (`src/lib/db/mongodb.ts`), storage uses Firebase:

- **Database** (`src/lib/db/`): Models in `src/lib/db/models/` for users, subscriptions, teams, SSO configs, analytics, usage tracking, API keys, webhook events, login attempts, and auth tokens
- **Cloud Storage** (`src/lib/storage/service.ts`): Firebase Storage for file upload/download with per-user quota tracking
- **Team Management** (`src/lib/teams/`): Teams with roles (owner/admin/member), invitation service, activity logging
- **Usage Analytics** (`src/lib/analytics/service.ts`): Event tracking, daily aggregation, usage summaries
- **SSO/SAML** (`src/lib/sso/`): Enterprise SSO with SAML, OIDC, Azure AD, Okta, Google Workspace support
- **Email Service** (`src/lib/email/`): Nodemailer-based email with queue system and templates

### Payment Gateways

Multi-gateway payment system (`src/lib/payments/`):

- **Stripe** (`src/lib/payments/stripe/`): Global payments, default gateway
- **Paymob** (`src/lib/payments/paymob/`): Egyptian market (EGP, mobile wallets)
- **PayTabs** (`src/lib/payments/paytabs/`): MENA region (Saudi Arabia, UAE, etc.)
- **Paddle** (`src/lib/payments/paddle/`): Merchant of Record for EU markets
- **Gateway Selector** (`src/lib/payments/gateway-selector.ts`): Auto-selects gateway based on country/currency

### State Management (Zustand)

Stores in `src/stores/` with `persist` middleware (localStorage):

- `editor-store.ts`: Editor content, view mode (editor/preview/split), fullscreen state, Monaco instance
- `theme-store.ts`: Document theme, code theme, UI theme mode, custom CSS
- `settings-store.ts`: Editor settings (fontSize, fontFamily, tabSize, wordWrap) and page settings (size, orientation, margins, watermark, headers/footers)

### Authentication

Uses NextAuth.js (`src/lib/auth/config.ts`) with JWT session strategy:

- GitHub OAuth, Google OAuth, and email/password credentials (bcrypt with 14 rounds)
- MongoDB for user storage (not Firebase Adapter)
- Password requirements in `src/lib/auth/password-validation.ts`: min 8 chars, uppercase, lowercase, number, special character

### API Routes

Core routes in `src/app/api/`:

- `POST /api/convert` - PDF conversion (60 req/min)
- `POST /api/convert/batch` - Batch conversion (10 req/min)
- `POST /api/preview` - HTML preview (120 req/min)
- `GET /api/themes`, `GET /api/templates`, `GET /api/health`
- `/api/storage/` - File upload, management, quota
- `/api/api-keys/` - API key CRUD
- `/api/teams/` - Team management CRUD
- `/api/analytics/` - Event tracking, summaries, history
- `/api/sso/` - SSO config, domain verification, audit logs
- `/api/checkout` - Payment checkout (auto-selects gateway)
- `/api/webhooks/{stripe,paymob,paytabs,paddle}` - Payment webhooks
- `/api/subscriptions/` - Invoices, pause/resume, portal, promo codes, payment methods

### Type Definitions

Core types in `src/types/index.ts`: `DocumentTheme`, `CodeTheme`, `PageSettings`, `ConversionOptions`, `ConversionResult`, `Template`, `BatchFile`.
Plan types in `src/lib/plans/config.ts`: `PlanType`, `PlanLimits`, `Plan`.

### Path Alias

`@/` maps to `./src/` (configured in tsconfig.json and vitest configs).

## TypeScript Strictness

The `tsconfig.json` enforces strict rules beyond the default `strict: true`:

- `noUnusedLocals` and `noUnusedParameters` - no dead variables/params
- `noImplicitReturns` - all code paths must return
- `noFallthroughCasesInSwitch` - switch cases must break/return
- `noImplicitOverride` - must use `override` keyword
- `useUnknownInCatchVariables` - catch variables are `unknown`, not `any`
- `forceConsistentCasingInFileNames`

## Testing Structure

- **Unit tests**: `__tests__/unit/` - Config: `vitest.config.ts`, jsdom environment
- **Integration tests**: `__tests__/integration/` - Config: `vitest.integration.config.ts`, 30s timeout
- **E2E tests**: `__tests__/e2e/` - Playwright across Chromium, Firefox, WebKit
- **Test setup**: `src/test/setup.ts` - Vitest globals enabled (`describe`, `it`, `expect` without imports)
- E2E: Playwright auto-starts server (`build + start`) unless one is running at localhost:3000
- E2E screenshots on failure saved to `./screenshots`

### Test Setup Mocks

The test setup (`src/test/setup.ts`) pre-mocks:

- `next/navigation` (useRouter, usePathname, useSearchParams)
- `next-intl` (useTranslations returns key passthrough, useLocale returns `'en'`)
- `window.matchMedia`, `ResizeObserver`
- Radix UI pointer capture methods (`hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView`)

## Environment Variables

Required: `NEXTAUTH_SECRET`, `MONGODB_URI`, `NEXTAUTH_URL`
Required for auth: `GITHUB_ID`/`GITHUB_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
Required for storage: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`
Optional payments: `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, `PAYMOB_*`, `PAYTABS_*`, `PADDLE_*`
Optional: `PUPPETEER_EXECUTABLE_PATH` (auto-detected), `UPSTASH_REDIS_*` (falls back to in-memory), `CLOUDINARY_*`, `EMAIL_SERVER_*`/`EMAIL_FROM`

Tuning: `MAX_CONCURRENT_CONVERSIONS` (default 5), `MONGODB_MAX_POOL_SIZE`/`MONGODB_MIN_POOL_SIZE` (10/2), `SLOW_QUERY_THRESHOLD_MS` (100)
