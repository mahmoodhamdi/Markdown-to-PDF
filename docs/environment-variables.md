# Environment Variables

This document describes all environment variables used by the Markdown-to-PDF application.

## Overview

The application uses Next.js environment variables. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Required Variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Application URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Session encryption key (generate with `openssl rand -base64 32`) |
| `MONGODB_URI` | MongoDB connection string |

## Optional Variables

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | `3000` | Server port number |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public application URL |

### Authentication (OAuth)

| Variable | Description |
|----------|-------------|
| `GITHUB_ID` | GitHub OAuth App Client ID |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

### Firebase (Storage)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_PROJECT_ID` | Firebase project ID (server) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |

### Payment Gateways

#### Stripe (Global)
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (`whsec_...`) |

#### Paymob (Egypt)
| Variable | Description |
|----------|-------------|
| `PAYMOB_API_KEY` | Paymob API key |
| `PAYMOB_SECRET_KEY` | Paymob secret key |
| `PAYMOB_PUBLIC_KEY` | Paymob public key |
| `PAYMOB_INTEGRATION_ID_CARD` | Card payment integration ID |
| `PAYMOB_INTEGRATION_ID_WALLET` | Mobile wallet integration ID |
| `PAYMOB_HMAC_SECRET` | Webhook HMAC secret |

#### PayTabs (MENA)
| Variable | Description |
|----------|-------------|
| `PAYTABS_PROFILE_ID` | PayTabs profile ID |
| `PAYTABS_SERVER_KEY` | PayTabs server key |
| `PAYTABS_CLIENT_KEY` | PayTabs client key |
| `PAYTABS_REGION` | Region code (ARE, SAU, EGY, JOR, OMN, BHR) |

#### Paddle (MoR)
| Variable | Description |
|----------|-------------|
| `PADDLE_API_KEY` | Paddle API key |
| `PADDLE_CLIENT_TOKEN` | Paddle client token |
| `PADDLE_WEBHOOK_SECRET` | Paddle webhook secret |
| `PADDLE_ENVIRONMENT` | `sandbox` or `production` |
| `PADDLE_SELLER_ID` | Paddle seller ID |

### Email (SMTP)

| Variable | Description |
|----------|-------------|
| `EMAIL_SERVER_HOST` | SMTP server host |
| `EMAIL_SERVER_PORT` | SMTP server port |
| `EMAIL_SERVER_USER` | SMTP username |
| `EMAIL_SERVER_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Sender email address |

### CI/CD Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CI` | - | Set to `true` in CI environments; affects test behavior |

## Development Setup

Create a `.env.local` file in the project root for local development:

```bash
# .env.local (example)

# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-character-secret-key-here
MONGODB_URI=mongodb://localhost:27017/markdown-to-pdf

# OAuth (optional - for testing auth)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Payments (optional - for testing payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Custom port
# PORT=3001
```

## Production Setup

For production deployments:

```bash
# .env.production

# Set to production
NODE_ENV=production

# Your domain (if needed for CORS)
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Docker Configuration

When running with Docker, pass environment variables:

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  markdown-to-pdf
```

Or use docker-compose:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

## Testing Configuration

Test-specific environment:

```bash
# Playwright uses these automatically
CI=true  # Enables CI mode in tests

# Vitest configuration
NODE_ENV=test
```

## Advanced Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUPPETEER_EXECUTABLE_PATH` | Auto-detected | Custom Chrome/Chromium path |
| `RATE_LIMIT_MAX` | Plan-based | Custom rate limit per minute |
| `MAX_FILE_SIZE` | Plan-based | Maximum upload file size |
| `REDIS_URL` | - | Redis URL for distributed rate limiting (optional) |

## Security Notes

1. **Never commit** `.env.local` or `.env.production` to version control
2. **Use secrets management** in production (e.g., Docker secrets, Kubernetes secrets)
3. **Validate** all environment variables at startup
4. **Avoid** sensitive data in `NEXT_PUBLIC_*` variables (they're exposed to clients)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Use different port
PORT=3001 npm run dev
```

### Environment Not Loading

1. Ensure `.env.local` is in project root
2. Restart the development server
3. Check file naming (`.env.local` not `.env.local.txt`)

### CI Tests Failing

```bash
# Ensure CI variable is set
CI=true npm run test:e2e
```
