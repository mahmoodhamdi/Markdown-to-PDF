# Environment Variables

This document describes all environment variables used by the Markdown-to-PDF application.

## Overview

The application uses Next.js environment variables. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Required Variables

None. The application works out of the box without any configuration.

## Optional Variables

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | `3000` | Server port number |

### CI/CD Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CI` | - | Set to `true` in CI environments; affects test behavior |

## Development Setup

Create a `.env.local` file in the project root for local development:

```bash
# .env.local (example)

# Optional: Custom port
# PORT=3001

# Optional: Enable debug logging
# DEBUG=true
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

## Future Variables

The following variables may be added in future versions:

| Variable | Purpose |
|----------|---------|
| `RATE_LIMIT_MAX` | Custom rate limit per minute |
| `MAX_FILE_SIZE` | Maximum upload file size |
| `PUPPETEER_EXECUTABLE_PATH` | Custom Chrome/Chromium path |
| `REDIS_URL` | Redis connection for distributed rate limiting |

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
