# Stage 6.4: Performance & Polish

**Phase:** 6 - Testing & Polish
**Priority:** 🟢 Final
**Estimated Effort:** Medium

---

## Context

Final polish phase: performance optimization, accessibility, and security audit.

---

## Task Requirements

### 1. Browser Pool Optimization

**File:** `src/lib/pdf/browser-pool.ts`

Improvements:
- [ ] Tune idle timeout based on usage patterns
- [ ] Add browser crash recovery
- [ ] Implement health checks
- [ ] Add metrics logging
- [ ] Consider warm-up strategy

### 2. Image Optimization in PDFs

**File:** `src/lib/pdf/generator.ts`

Improvements:
- [ ] Compress large images before PDF
- [ ] Lazy load images in preview
- [ ] Support WebP format
- [ ] Add image size limits

### 3. Bundle Size Optimization

**Tasks:**
- [ ] Analyze bundle with `next build --analyze`
- [ ] Lazy load Monaco editor
- [ ] Lazy load Mermaid
- [ ] Code split dashboard routes
- [ ] Tree shake unused code

### 4. Accessibility Audit

**Tools:** Use `@axe-core/playwright`

Checklist:
- [ ] All interactive elements focusable
- [ ] Proper ARIA labels
- [ ] Color contrast (WCAG AA)
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Focus indicators visible

### 5. Security Audit

Checklist:
- [ ] XSS protection verified
- [ ] CSRF protection in place
- [ ] SQL/NoSQL injection protected
- [ ] Rate limiting enforced
- [ ] Secure headers configured
- [ ] Secrets not exposed
- [ ] Dependencies updated
- [ ] npm audit passes

### 6. Performance Metrics

Target Lighthouse scores:
- [ ] Performance: 90+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 90+

---

## Bundle Analysis

```bash
# Analyze bundle
ANALYZE=true npm run build

# Check for large dependencies
npx depcheck
npx bundlephobia
```

---

## Security Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
];
```

---

## Performance Optimization

### Critical Path

1. Minimize blocking resources
2. Optimize LCP (Largest Contentful Paint)
3. Reduce CLS (Cumulative Layout Shift)
4. Improve FID (First Input Delay)

### Caching Strategy

```typescript
// Cache static assets aggressively
// Cache API responses where appropriate
// Implement stale-while-revalidate
```

---

## Definition of Done

- [ ] Browser pool optimized
- [ ] Images optimized
- [ ] Bundle size reduced by 20%
- [ ] Accessibility audit passes
- [ ] Security audit passes
- [ ] Lighthouse scores 90+
- [ ] No console errors
- [ ] All deprecation warnings fixed

---

## Final Verification

Before marking production ready:

1. [ ] All tests passing (unit, integration, E2E)
2. [ ] No TypeScript errors
3. [ ] No ESLint warnings
4. [ ] All translations complete
5. [ ] Documentation updated
6. [ ] CHANGELOG updated
7. [ ] Version bumped
8. [ ] Docker build works
9. [ ] Deployment tested

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` all stages to ✅ Complete and mark as PRODUCTION READY*
