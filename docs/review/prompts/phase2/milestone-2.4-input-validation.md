# Milestone 2.4: Input Validation Review

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Medium

---

## Objective

Review and strengthen input validation across all API endpoints to prevent injection attacks and ensure data integrity.

---

## Validation Framework

The application uses **Zod** for validation. Ensure consistent usage.

---

## Review Areas

### 1. User Input Sanitization

#### HTML/XSS Prevention
**File:** `src/lib/sanitize.ts`

Verify:
- [ ] DOMPurify is used for HTML content
- [ ] Markdown is sanitized before rendering
- [ ] User-provided CSS is sanitized (Custom CSS feature)

```typescript
// Ensure this pattern is used
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'blockquote', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
  });
}
```

### 2. API Schema Validation

Review each API endpoint for proper Zod schemas:

#### Convert Endpoint
```typescript
// src/app/api/convert/route.ts
const convertSchema = z.object({
  markdown: z.string().min(1).max(5000000), // 5MB limit
  theme: z.enum(['github', 'academic', 'minimal', 'dark', 'professional', 'elegant', 'modern', 'newsletter']),
  pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3', 'Custom']).optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  customCss: z.string().max(50000).optional(), // 50KB limit
});
```

#### User Registration
```typescript
// src/app/api/auth/register/route.ts
const registerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
});
```

#### Team Creation
```typescript
// src/app/api/teams/route.ts
const createTeamSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});
```

### 3. File Upload Validation

**File:** `src/app/api/storage/upload/route.ts`

Verify:
- [ ] File size limits enforced
- [ ] File type validation (MIME type + extension)
- [ ] Filename sanitization
- [ ] Path traversal prevention

```typescript
// File validation
const ALLOWED_TYPES = ['text/markdown', 'text/plain', 'application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): boolean {
  // Check size
  if (file.size > MAX_FILE_SIZE) return false;

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) return false;

  // Sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

  return true;
}
```

### 4. URL/Path Validation

Prevent SSRF and path traversal:

```typescript
// Validate URLs
const urlSchema = z.string().url().refine((url) => {
  const parsed = new URL(url);
  return ['http:', 'https:'].includes(parsed.protocol);
}, 'Invalid URL protocol');

// Prevent path traversal
function sanitizePath(path: string): string {
  return path.replace(/\.\./g, '').replace(/\/\//g, '/');
}
```

### 5. Numeric Input Validation

```typescript
// Page margins (in mm)
const marginSchema = z.number().min(0).max(100);

// Font sizes
const fontSizeSchema = z.number().int().min(8).max(72);

// Pagination
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
```

---

## Endpoints to Review

### High Priority:
1. `/api/convert` - Large markdown input
2. `/api/auth/register` - User credentials
3. `/api/auth/reset-password` - Password input
4. `/api/storage/upload` - File upload
5. `/api/teams` - Team name input

### Medium Priority:
1. `/api/users/profile` - Profile updates
2. `/api/teams/[teamId]/members` - Email input
3. `/api/sso/config` - SSO configuration
4. `/api/analytics/track` - Event data

---

## Common Validation Patterns

### String Sanitization
```typescript
const safeString = z.string()
  .trim()
  .min(1)
  .max(255)
  .transform(s => s.replace(/[<>]/g, '')); // Remove angle brackets
```

### Email Normalization
```typescript
const email = z.string()
  .email()
  .toLowerCase()
  .transform(e => e.trim());
```

### ID Validation
```typescript
const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
```

---

## Files to Review/Modify

1. `src/lib/sanitize.ts`
2. `src/lib/validations/api-schemas.ts`
3. All API routes in `src/app/api/`

---

## Testing

### Unit Tests:
1. Valid input passes
2. Invalid input rejected with proper error
3. Edge cases handled (empty, max length, special chars)
4. XSS attempts blocked

### Integration Tests:
1. API rejects malformed requests
2. Error messages don't leak internal info

---

## Acceptance Criteria

- [ ] All endpoints use Zod validation
- [ ] HTML content sanitized
- [ ] File uploads validated
- [ ] URLs validated
- [ ] No SQL/NoSQL injection possible
- [ ] No XSS possible
- [ ] Error messages are user-friendly
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 2.4 status to ✅
2. Update progress bar
3. Add to completion log
