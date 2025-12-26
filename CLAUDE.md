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

# Run a single test file
npx vitest run __tests__/unit/lib/utils.test.ts
npx vitest run __tests__/unit/lib/utils.test.ts -t "test name"  # Run specific test

# Format
npm run format            # Prettier format all files
npm run format:check      # Check formatting without changes

# Database (MongoDB via Docker)
npm run db:start          # Start MongoDB container
npm run db:stop           # Stop MongoDB container
npm run db:seed           # Seed database with sample data

# Docker
docker-compose -f docker/docker-compose.yml up          # Start app with Docker
docker-compose -f docker/docker-compose.prod.yml up     # Production mode
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `PUPPETEER_EXECUTABLE_PATH` | Chrome/Chromium path | Auto-detected |
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth session secret | Required |
| `MONGODB_URI` | MongoDB connection string | Required |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth credentials | Required for auth |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config | Required for storage |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Admin | Required for storage |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe payments (Global) | Optional |
| `PAYMOB_SECRET_KEY` / `PAYMOB_HMAC_SECRET` | Paymob payments (Egypt) | Optional |
| `PAYTABS_SERVER_KEY` / `PAYTABS_PROFILE_ID` | PayTabs payments (MENA) | Optional |
| `PADDLE_API_KEY` / `PADDLE_WEBHOOK_SECRET` | Paddle payments (MoR) | Optional |
| `EMAIL_SERVER_*` | SMTP configuration | Required for email features |

## Architecture Overview

### Core Processing Pipeline

1. **Markdown Parser** (`src/lib/markdown/parser.ts`): Converts markdown to HTML using `marked` with extensions for GFM, syntax highlighting (highlight.js), KaTeX math, Mermaid diagrams, and emoji shortcodes. All parsing flows through `parseMarkdownFull()`.

2. **PDF Generator** (`src/lib/pdf/generator.ts`): Uses Puppeteer to render HTML and generate PDFs. `generateHtmlDocument()` creates the full HTML with theme CSS, KaTeX/Mermaid scripts. `generatePdf()` launches headless Chrome for conversion.

3. **Theme Manager** (`src/lib/themes/manager.ts`): Manages document themes (github, academic, minimal, dark, professional, elegant, modern, newsletter) and code themes. CSS is embedded directly in the file to avoid import issues.

### Freemium Plan System

Plans defined in `src/lib/plans/config.ts` with four tiers: `free`, `pro`, `team`, `enterprise`. Each plan has limits for:
- Daily conversions and API calls
- Max file size and batch files
- Available themes (some are premium-only)
- Cloud storage quota
- Team member seats
- Custom CSS/headers/footers

Key modules:
- `src/lib/plans/usage.ts` - Track daily usage against limits
- `src/lib/plans/rate-limit.ts` - Plan-aware rate limiting
- `src/lib/stripe/` - Stripe checkout and webhook handling

### Backend Services (MongoDB + Firebase Storage)

Database uses MongoDB with Mongoose (`src/lib/db/mongodb.ts`), Storage uses Firebase:

- **Database** (`src/lib/db/`): MongoDB models for users, subscriptions, teams, SSO configs, analytics
- **Cloud Storage** (`src/lib/storage/service.ts`): Firebase Storage for file upload/download with per-user quota tracking
- **Team Management** (`src/lib/teams/service.ts`): Teams with roles (owner/admin/member), invitations, shared settings
- **Usage Analytics** (`src/lib/analytics/service.ts`): Event tracking, daily aggregation, usage summaries
- **SSO/SAML** (`src/lib/sso/`): Enterprise SSO with SAML, OIDC, Azure AD, Okta, Google Workspace support
- **Email Service** (`src/lib/email/`): Nodemailer-based email with templates for welcome, password reset, subscription, team invitations, email change

### Payment Gateways

Multi-gateway payment system (`src/lib/payments/`):

- **Stripe** (`src/lib/payments/stripe/`): Global payments, default gateway
- **Paymob** (`src/lib/payments/paymob/`): Egyptian market (EGP, mobile wallets)
- **PayTabs** (`src/lib/payments/paytabs/`): MENA region (Saudi Arabia, UAE, etc.)
- **Paddle** (`src/lib/payments/paddle/`): Merchant of Record for EU markets
- **Gateway Selector** (`src/lib/payments/gateway-selector.ts`): Auto-selects gateway based on country/currency

### State Management (Zustand)

- `editor-store.ts`: Editor content, view mode (editor/preview/split), fullscreen state
- `theme-store.ts`: Document theme, code theme, UI theme mode
- `settings-store.ts`: Page settings (size, orientation, margins, watermark, headers/footers)

All stores use `persist` middleware to save to localStorage.

### Authentication

Uses NextAuth.js (`src/lib/auth/config.ts`) with JWT session strategy:
- GitHub OAuth provider
- Google OAuth provider
- Email/password credentials (bcrypt)
- MongoDB for user storage (not Firebase Adapter)

### Internationalization

- Uses `next-intl` with locale routing (`src/i18n/`)
- Supported locales: `en`, `ar` (with RTL support)
- Translation files: `src/messages/{en,ar}.json`
- Routes are prefixed with locale: `/en/`, `/ar/`

### Dashboard Pages

User dashboard at `/[locale]/dashboard/`:
- `page.tsx` - Main dashboard with overview cards
- `usage/` - Usage metrics and limits visualization
- `subscription/` - Subscription management and plan switching
- `analytics/` - Conversion analytics with charts
- `teams/` - Team dashboard (for team/enterprise plans)

### API Routes

Core routes in `src/app/api/`:
- `POST /api/convert` - PDF conversion (60 req/min)
- `POST /api/convert/batch` - Batch conversion (10 req/min)
- `POST /api/preview` - HTML preview (120 req/min)
- `GET /api/themes` - Available themes
- `GET /api/templates` - Document templates
- `GET /api/health` - Health check

Storage routes (`/api/storage/`):
- `POST /api/storage/upload` - Upload file
- `GET|DELETE /api/storage/files/[fileId]` - Manage files
- `GET /api/storage/quota` - Check quota

Team routes (`/api/teams/`):
- CRUD operations for teams and members

Analytics routes (`/api/analytics/`):
- `POST /api/analytics/track` - Track events
- `GET /api/analytics/summary` - Usage summary
- `GET /api/analytics/history` - Historical data

SSO routes (`/api/sso/`):
- Configuration, domain verification, audit logs

Payment routes:
- `POST /api/checkout` - Create checkout session (auto-selects or uses specified gateway)
- `GET /api/checkout` - Get available gateways for user's region
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
- `POST /api/webhooks/paymob` - Handle Paymob webhooks
- `POST /api/webhooks/paytabs` - Handle PayTabs webhooks
- `POST /api/webhooks/paddle` - Handle Paddle webhooks

### Type Definitions

Core types in `src/types/index.ts`:
- `DocumentTheme`, `CodeTheme` - Theme enums
- `PageSettings`, `PageMargins`, `Watermark` - PDF configuration
- `ConversionOptions`, `ConversionResult` - API contracts
- `Template`, `BatchFile` - Feature-specific types

Plan types in `src/lib/plans/config.ts`:
- `PlanType`, `PlanLimits`, `Plan`

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
- Integration tests: `__tests__/integration/` - API route testing (30s timeout)
- E2E tests: `__tests__/e2e/` - Playwright browser tests
- Test setup: `src/test/setup.ts` - jsdom environment with testing-library
- Vitest globals enabled (`describe`, `it`, `expect` available without imports)

## Documentation

- `docs/architecture.md` - System architecture diagrams and data flow
- `docs/plans/` - Feature implementation plans with staged prompts
- `docs/plans/MASTER_IMPLEMENTATION_PLAN.md` - Overview of all planned stages
