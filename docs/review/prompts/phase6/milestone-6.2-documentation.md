# Milestone 6.2: Documentation Update

## Status: ⬜ Not Started
## Priority: LOW
## Estimated Scope: Medium

---

## Objective

Update all documentation to reflect current implementation and ensure accuracy.

---

## Documentation Files

### 1. README.md

**Review:**
- [ ] Features list accurate
- [ ] Screenshots current
- [ ] Quick start works
- [ ] API examples correct
- [ ] Environment variables complete
- [ ] Pricing table current

**Updates needed:**
- Add any new features
- Update outdated screenshots
- Verify all commands work
- Add troubleshooting section

### 2. CLAUDE.md

**Review:**
- [ ] Build commands accurate
- [ ] Architecture current
- [ ] All services documented
- [ ] API routes complete
- [ ] Environment variables complete

### 3. CONTRIBUTING.md

**Review:**
- [ ] Setup instructions work
- [ ] Testing instructions accurate
- [ ] PR process documented
- [ ] Code style guidelines

### 4. SELF_HOSTING.md

**Review:**
- [ ] Docker instructions work
- [ ] Environment setup complete
- [ ] Database setup accurate
- [ ] Reverse proxy examples

### 5. API Documentation

**Location:** `src/app/[locale]/api-docs/page.tsx`

**Review:**
- [ ] All endpoints documented
- [ ] Request/response examples
- [ ] Authentication explained
- [ ] Rate limits documented
- [ ] Error codes listed

---

## New Documentation to Create

### 1. Deployment Guide

```markdown
# Deployment Guide

## Prerequisites
- Node.js 18+
- MongoDB database
- Firebase project
- Payment gateway accounts (optional)

## Deployment Options

### Vercel (Recommended)
1. Connect GitHub repo
2. Configure environment variables
3. Deploy

### Docker
docker-compose -f docker/docker-compose.prod.yml up -d

### Self-hosted
See SELF_HOSTING.md
```

### 2. Security Best Practices

```markdown
# Security Best Practices

## Environment Variables
- Never commit .env files
- Use secrets management in production
- Rotate API keys regularly

## Authentication
- Use strong passwords (8+ chars)
- Enable 2FA when available
- Review active sessions regularly

## API Usage
- Keep API keys secure
- Use HTTPS always
- Implement proper rate limiting
```

### 3. Troubleshooting Guide

```markdown
# Troubleshooting

## Common Issues

### PDF generation fails
- Check Puppeteer installation
- Verify Chrome/Chromium path
- Check memory limits

### Database connection issues
- Verify MongoDB URI
- Check network connectivity
- Verify credentials

### Authentication issues
- Check NextAuth configuration
- Verify OAuth callback URLs
- Check session settings
```

---

## Code Documentation

### JSDoc Comments

Add to key functions:

```typescript
/**
 * Converts markdown to PDF using Puppeteer.
 *
 * @param markdown - The markdown content to convert
 * @param options - Conversion options including theme and page settings
 * @returns Promise resolving to the PDF buffer
 *
 * @example
 * const pdf = await generatePdf('# Hello', { theme: 'github' });
 *
 * @throws {Error} If markdown is empty
 * @throws {Error} If PDF generation fails
 */
export async function generatePdf(
  markdown: string,
  options: ConversionOptions
): Promise<Buffer> {
  // ...
}
```

### Type Documentation

```typescript
/**
 * User subscription plan types.
 *
 * - `free` - Basic features, limited conversions
 * - `pro` - All features, higher limits
 * - `team` - Team collaboration features
 * - `enterprise` - Custom limits, SSO, dedicated support
 */
export type PlanType = 'free' | 'pro' | 'team' | 'enterprise';
```

---

## OpenAPI Specification

**File:** `src/app/api/openapi/route.ts`

**Verify:**
- All endpoints included
- Request/response schemas accurate
- Authentication documented
- Examples provided

```typescript
// Example schema
paths:
  /api/convert:
    post:
      summary: Convert markdown to PDF
      description: Converts markdown content to a PDF document
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - markdown
              properties:
                markdown:
                  type: string
                  description: Markdown content
                theme:
                  type: string
                  enum: [github, academic, minimal, dark, professional, elegant, modern, newsletter]
                  default: github
      responses:
        '200':
          description: PDF generated successfully
          content:
            application/pdf:
              schema:
                type: string
                format: binary
        '400':
          description: Invalid request
        '429':
          description: Rate limit exceeded
```

---

## Changelog

**File:** `CHANGELOG.md`

Keep updated with:
- New features
- Bug fixes
- Breaking changes
- Security updates

```markdown
# Changelog

## [Unreleased]

### Added
- Files management page in dashboard
- API key authentication

### Fixed
- Usage page now shows real storage data
- Rate limiting persists across restarts

### Changed
- Improved PDF generation performance

### Security
- Enhanced webhook signature verification
```

---

## Files to Create/Modify

### Create:
1. `docs/DEPLOYMENT.md`
2. `docs/SECURITY.md`
3. `docs/TROUBLESHOOTING.md`

### Modify:
1. `README.md`
2. `CLAUDE.md`
3. `CONTRIBUTING.md`
4. `SELF_HOSTING.md`
5. `CHANGELOG.md`
6. `src/app/api/openapi/route.ts`

---

## Review Process

1. Read through each document
2. Test all commands/examples
3. Verify against current code
4. Update outdated sections
5. Add missing information
6. Fix typos and formatting

---

## Acceptance Criteria

- [ ] README accurate and complete
- [ ] CLAUDE.md current
- [ ] All commands work as documented
- [ ] API docs match implementation
- [ ] OpenAPI spec complete
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] Changelog updated
- [ ] No broken links
- [ ] Grammar/spelling checked

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 6.2 status to ✅
2. Update progress bar
3. Add to completion log
4. **Mark entire review as COMPLETE**
