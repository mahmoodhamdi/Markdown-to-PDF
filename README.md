# Markdown to PDF Converter

A production-ready Markdown to PDF converter web application built with Next.js 14, TypeScript, and Tailwind CSS. Features a freemium model with user authentication, team management, and enterprise SSO support.

![Editor Screenshot](screenshots/editor-en.png)

## Features

### Core Features
- **Live Preview** - See changes in real-time as you type
- **8 Document Themes** - GitHub, Academic, Minimal, Dark, Professional, Elegant, Modern, Newsletter
- **Syntax Highlighting** - Support for 20+ programming languages
- **Math Equations** - LaTeX/KaTeX support
- **Mermaid Diagrams** - Flowcharts, sequence diagrams, and more
- **Batch Conversion** - Convert multiple files at once
- **15+ Document Templates** - Resume, Thesis, README, Meeting Notes, and more
- **Bilingual Support** - English and Arabic with full RTL support
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Docker Support** - Easy deployment with Docker
- **REST API** - Programmatic access to conversion features

### Premium Features
- **User Authentication** - GitHub, Google, and email login
- **Cloud Storage** - Save documents in the cloud
- **Custom CSS** - Style your documents with custom CSS
- **Team Management** - Collaborate with team members
- **Usage Analytics** - Track conversion metrics
- **Priority Rendering** - Faster PDF generation
- **No Watermark** - Remove watermark from PDFs

### Enterprise Features
- **SSO Integration** - SAML, OIDC, Azure AD, Okta, Google Workspace
- **Custom Domains** - Use your own domain
- **SLA Guarantee** - 99.9% uptime
- **Priority Support** - Dedicated support channel
- **Self-Hosting** - Deploy on your own infrastructure

## Screenshots

### Main Editor (English)
![Editor English](screenshots/editor-en.png)

### Main Editor (Arabic RTL)
![Editor Arabic](screenshots/editor-ar.png)

### Theme Selection
![Themes](screenshots/themes.png)

### Document Templates
![Templates](screenshots/templates.png)

### Batch Conversion
![Batch](screenshots/batch.png)

### API Documentation
![API Docs](screenshots/api-docs.png)

### Mobile View
![Mobile](screenshots/mobile.png)

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **Markdown**: marked + highlight.js
- **PDF Generation**: Puppeteer
- **Math**: KaTeX
- **Diagrams**: Mermaid
- **State Management**: Zustand
- **Internationalization**: next-intl
- **Testing**: Vitest + Playwright (709 tests)
- **UI Components**: Radix UI
- **Authentication**: NextAuth.js
- **Database**: MongoDB (Mongoose)
- **Storage**: Firebase Storage
- **Payments**: Multi-gateway (Stripe, Paymob, PayTabs, Paddle)

## API Documentation

### Convert to PDF

```bash
POST /api/convert
Content-Type: application/json

{
  "markdown": "# Hello World",
  "theme": "github",
  "pageSize": "A4",
  "orientation": "portrait"
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

### Batch Conversion

```bash
POST /api/convert/batch
Content-Type: application/json

{
  "files": [
    { "name": "doc1.md", "content": "# Document 1" },
    { "name": "doc2.md", "content": "# Document 2" }
  ],
  "theme": "github"
}
```

### Get Available Themes

```bash
GET /api/themes
```

### Get Document Templates

```bash
GET /api/templates
```

### Health Check

```bash
GET /api/health
```

### Checkout (Payment)

```bash
POST /api/checkout
Content-Type: application/json

{
  "plan": "pro",
  "billing": "monthly",
  "gateway": "stripe",      // Optional: stripe, paymob, paytabs, paddle
  "countryCode": "US"       // Optional: auto-selects gateway
}
```

### Storage

```bash
# Upload file
POST /api/storage/upload

# List files
GET /api/storage/files

# Get storage quota
GET /api/storage/quota
```

### Teams

```bash
# Create team
POST /api/teams

# Get team
GET /api/teams/[teamId]

# Manage members
POST /api/teams/[teamId]/members
```

### Analytics

```bash
# Track event
POST /api/analytics/track

# Get summary
GET /api/analytics/summary

# Get history
GET /api/analytics/history
```

## Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Docker Deployment

### Build and Run

```bash
# Build the Docker image
docker build -f docker/Dockerfile -t markdown-to-pdf .

# Run the container
docker run -p 3000:3000 markdown-to-pdf
```

### Docker Compose

```bash
# Development
docker-compose -f docker/docker-compose.yml up

# Production
docker-compose -f docker/docker-compose.prod.yml up
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── page.tsx       # Main editor page
│   │   ├── themes/        # Theme selection
│   │   ├── templates/     # Document templates
│   │   ├── batch/         # Batch conversion
│   │   └── api-docs/      # API documentation
│   └── api/               # API routes
│       ├── convert/       # PDF conversion
│       ├── checkout/      # Payment checkout
│       ├── webhooks/      # Payment webhooks (Stripe, Paymob, PayTabs, Paddle)
│       ├── storage/       # Cloud storage
│       ├── teams/         # Team management
│       ├── analytics/     # Usage analytics
│       └── sso/           # Enterprise SSO
├── components/            # React components
│   ├── editor/           # Editor components
│   ├── preview/          # Preview components
│   ├── converter/        # Conversion components
│   ├── layout/           # Layout components
│   └── ui/               # UI primitives
├── lib/                   # Core libraries
│   ├── markdown/         # Markdown parser
│   ├── pdf/              # PDF generator
│   ├── themes/           # Theme manager
│   ├── payments/         # Multi-gateway payments
│   ├── storage/          # Cloud storage service
│   ├── teams/            # Team management service
│   ├── analytics/        # Analytics service
│   ├── sso/              # SSO service
│   ├── db/               # MongoDB models & connection
│   └── plans/            # Pricing & rate limiting
├── stores/               # Zustand stores
├── messages/             # i18n translations
└── types/                # TypeScript types
```

## Environment Variables

See [CREDENTIALS.md](CREDENTIALS.md) for detailed setup instructions.

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Session encryption key (32+ chars) | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `FIREBASE_*` | Firebase Storage configuration | Yes |
| `GITHUB_ID/SECRET` | GitHub OAuth | Optional |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth | Optional |
| `STRIPE_SECRET_KEY` | Stripe payments (Global) | Optional |
| `PAYMOB_SECRET_KEY` | Paymob payments (Egypt) | Optional |
| `PAYTABS_SERVER_KEY` | PayTabs payments (MENA) | Optional |
| `PADDLE_API_KEY` | Paddle payments (MoR) | Optional |
| `EMAIL_SERVER_*` | SMTP configuration | Optional |

## Pricing Plans

| Feature | Free | Pro ($5/mo) | Team ($15/mo) | Enterprise |
|---------|------|-------------|---------------|------------|
| Conversions/day | 20 | 500 | Unlimited | Unlimited |
| File size | 500KB | 5MB | 20MB | 100MB |
| Themes | 3 | All | All + Brand | Custom |
| Cloud Storage | - | 1GB | 10GB | Unlimited |
| Team Members | - | - | 5 | Unlimited |
| SSO | - | - | - | Yes |

## Self-Hosting

See [SELF_HOSTING.md](SELF_HOSTING.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with love by [mahmoodhamdi](https://github.com/mahmoodhamdi)
