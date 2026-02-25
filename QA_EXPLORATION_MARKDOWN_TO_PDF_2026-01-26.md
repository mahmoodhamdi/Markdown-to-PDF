# QA Exploration Document - Markdown to PDF Converter

**Project:** Markdown to PDF Converter
**Date:** 2026-01-26
**Version:** 1.2.0

---

## Tech Stack Identified

### Frontend:
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Tailwind CSS + Radix UI primitives
- **State Management:** Zustand (with persist middleware)
- **Language:** TypeScript
- **Editor:** Monaco Editor
- **Markdown Processing:** marked + highlight.js + KaTeX + Mermaid

### Backend:
- **Framework:** Next.js API Routes
- **Language:** TypeScript / Node.js
- **API Type:** REST
- **PDF Generation:** Puppeteer

### Database:
- **Type:** MongoDB
- **ORM:** Mongoose

### Authentication:
- **Method:** JWT (NextAuth.js)
- **Providers:** GitHub OAuth, Google OAuth, Email/Password credentials

### Additional:
- **File Storage:** Firebase Storage
- **Payments:** Multi-gateway (Stripe, Paymob, PayTabs, Paddle)
- **Internationalization:** next-intl (en, ar with RTL support)

---

## Complete Feature Map

### Authentication & Authorization

| Feature | Exists | Location | Selectors |
|---------|--------|----------|-----------|
| Login | Yes | `/auth/login` | `#email`, `#password`, `button[type="submit"]` |
| Register | Yes | `/auth/register` | `#name`, `#email`, `#password`, `#confirmPassword` |
| Forgot Password | Yes | `/api/auth/forgot-password` | API only |
| Reset Password | Yes | `/api/auth/reset-password` | API only |
| Email Verification | Yes | `/verify-email/[token]` | Token-based |
| OAuth (GitHub) | Yes | `/auth/login` | Button with GitHub icon |
| OAuth (Google) | Yes | `/auth/login` | Button with Google icon |
| Logout | Yes | User menu dropdown | Dropdown item |

### User Roles & Plans

| Plan | Daily Conversions | Max File Size | Cloud Storage | Features |
|------|-------------------|---------------|---------------|----------|
| free | 20 | 500 KB | None | 3 themes, watermark |
| pro | 500 | 5 MB | 1 GB | All themes, no watermark, custom CSS |
| team | Unlimited | 20 MB | 10 GB | + Team members (5), priority rendering |
| enterprise | Unlimited | 100 MB | Unlimited | + SSO, unlimited team, priority support |

### Pages & Modules

| Module | Path | Features |
|--------|------|----------|
| Home/Editor | `/` | Monaco editor, live preview, split view, fullscreen |
| Templates | `/templates` | Document templates gallery |
| Themes | `/themes` | Theme selection (8 themes) |
| Batch Conversion | `/batch` | Multiple file conversion |
| Pricing | `/pricing` | Plan comparison, checkout |
| API Docs | `/api-docs` | REST API documentation |
| Settings | `/settings` | Appearance, export, editor settings |
| Dashboard | `/dashboard` | Overview with stats |
| Dashboard/Profile | `/dashboard/profile` | User profile management |
| Dashboard/Account | `/dashboard/account` | Account settings, data export, delete |
| Dashboard/Security | `/dashboard/security` | Password, sessions, connected accounts |
| Dashboard/API Keys | `/dashboard/api-keys` | API key management |
| Dashboard/Files | `/dashboard/files` | Cloud storage file management |
| Dashboard/Usage | `/dashboard/usage` | Usage statistics and limits |
| Dashboard/Analytics | `/dashboard/analytics` | Conversion analytics with charts |
| Dashboard/Subscription | `/dashboard/subscription` | Plan management, billing |
| Dashboard/Teams | `/dashboard/teams` | Team management (team/enterprise) |

### UI Features

| Feature | Exists | Location | Selector |
|---------|--------|----------|----------|
| Dark Mode | Yes | Header | Theme toggle button (cycles light/dark/system) |
| Light Mode | Yes | Header | Theme toggle button |
| RTL Support | Yes | Global | `/ar/` locale routes |
| Multi-language | Yes | Header | Language switcher (en, ar) |
| Responsive | Yes | Global | Mobile tabs, hamburger menu |
| Toast Notifications | Yes | Global | Sonner toast provider |
| Modals/Dialogs | Yes | Various | Radix dialog components |

### Data Features

| Feature | Modules |
|---------|---------|
| Pagination | Files, Usage history |
| Search | Templates, Themes |
| Filters | Analytics (date range) |
| Export | User data (JSON/CSV) |
| File Upload | Editor, Cloud storage, Avatar |

### Forms Identified

| Form | Location | Fields |
|------|----------|--------|
| Login | `/auth/login` | email, password |
| Register | `/auth/register` | name, email, password, confirmPassword |
| Profile Edit | `/dashboard/profile` | name, bio, website, location |
| Password Change | `/dashboard/security` | currentPassword, newPassword, confirmNewPassword |
| Create API Key | `/dashboard/api-keys` | name, permissions |
| Create Team | `/dashboard/teams` | name |
| Add Team Member | `/dashboard/teams/[id]` | email, role |
| Page Settings | Converter dialog | pageSize, orientation, margins, etc. |

### API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/convert` | Optional | PDF conversion |
| POST | `/api/convert/batch` | Yes | Batch conversion |
| POST | `/api/preview` | Optional | HTML preview |
| GET | `/api/themes` | No | Available themes |
| GET | `/api/templates` | No | Document templates |
| GET | `/api/health` | No | Health check |
| GET/POST | `/api/api-keys` | Yes | API key management |
| POST | `/api/checkout` | Yes | Payment checkout |
| GET/POST | `/api/storage/*` | Yes | File storage |
| GET/POST | `/api/teams/*` | Yes | Team management |
| GET/POST | `/api/analytics/*` | Yes | Usage analytics |

---

## Test Users

**Note:** Seeded users use OAuth (no passwords). For credential testing, register new users:

| Role | Email | Plan |
|------|-------|------|
| Free User | free.user@example.com | free |
| Pro User | pro.user@example.com | pro |
| Team Owner | team.owner@example.com | team |
| Enterprise Admin | enterprise.admin@acme-corp.com | enterprise |

**For credential login testing, register:**
- `test.free@example.com` / `TestPass123!`
- `test.pro@example.com` / `TestPass123!`

---

## Test Priority Matrix

| Priority | Features |
|----------|----------|
| P0 - Critical | Login, Register, PDF Conversion, Editor functionality |
| P1 - High | Theme switching, Language switching, Dashboard access |
| P2 - Medium | Batch conversion, Templates, API docs |
| P3 - Low | Animations, Nice-to-have UI polish |

---

## Key Selectors for Testing

### Header
- Theme toggle: `button[title]` (has Sun/Moon/Monitor icon)
- Language switcher: Language dropdown
- User menu: Avatar button or Login link
- Mobile menu: `button[aria-label="Open menu"]`

### Login Page
- Email: `#email`
- Password: `#password`
- Submit: `button[type="submit"]`
- GitHub OAuth: Button containing GitHub icon
- Google OAuth: Button containing Google SVG
- Register link: `a[href*="register"]`

### Register Page
- Name: `#name`
- Email: `#email`
- Password: `#password`
- Confirm Password: `#confirmPassword`
- Submit: `button[type="submit"]`

### Editor (Home Page)
- Monaco Editor: `.monaco-editor`
- Preview: Markdown preview panel
- Convert Button: Convert to PDF button
- Toolbar: Editor toolbar buttons
- View tabs (mobile): `[role="tablist"]`

### Dashboard
- Sidebar: Dashboard navigation
- Cards: Stats cards with usage info
