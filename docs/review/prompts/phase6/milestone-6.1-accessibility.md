# Milestone 6.1: Accessibility Audit

## Status: 🔄 In Progress
## Priority: MEDIUM
## Estimated Scope: Medium
## Last Updated: 2025-12-30

---

## Objective

Conduct a comprehensive accessibility audit and fix issues to meet WCAG 2.1 AA standards.

---

## Audit Tools

1. **Axe DevTools** - Browser extension
2. **Lighthouse** - Built into Chrome DevTools
3. **@axe-core/playwright** - Automated E2E testing (already installed)
4. **Screen reader testing** - NVDA, VoiceOver

---

## WCAG 2.1 AA Checklist

### 1. Perceivable

#### 1.1 Text Alternatives
- [ ] All images have alt text
- [ ] Decorative images have empty alt=""
- [ ] Complex images have long descriptions
- [ ] Icons have aria-labels

#### 1.2 Time-based Media
- [ ] N/A (no video/audio content)

#### 1.3 Adaptable
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Semantic HTML used (nav, main, aside, etc.)
- [ ] Form labels associated with inputs
- [ ] Tables have headers

#### 1.4 Distinguishable
- [ ] Color contrast ratio ≥ 4.5:1 (text)
- [ ] Color contrast ratio ≥ 3:1 (UI components)
- [ ] Text resizable to 200%
- [ ] No loss of content when zoomed
- [ ] Focus indicators visible

### 2. Operable

#### 2.1 Keyboard Accessible
- [ ] All functionality accessible via keyboard
- [ ] No keyboard traps
- [ ] Skip links for navigation
- [ ] Focus order logical

#### 2.2 Enough Time
- [ ] User can control time limits
- [ ] Auto-refresh can be disabled

#### 2.3 Seizures
- [ ] No flashing content > 3 times/second

#### 2.4 Navigable
- [ ] Page titles descriptive
- [ ] Focus order matches visual order
- [ ] Link purpose clear from text
- [ ] Multiple ways to find pages
- [ ] Headings describe content

#### 2.5 Input Modalities
- [ ] Target size ≥ 44x44px
- [ ] Pointer gestures have alternatives

### 3. Understandable

#### 3.1 Readable
- [ ] Language of page specified
- [ ] Language of parts specified

#### 3.2 Predictable
- [ ] Focus doesn't change context
- [ ] Input doesn't change context unexpectedly
- [ ] Navigation consistent

#### 3.3 Input Assistance
- [ ] Error messages descriptive
- [ ] Labels/instructions provided
- [ ] Error prevention on important actions

### 4. Robust

#### 4.1 Compatible
- [ ] Valid HTML
- [ ] Name, role, value for custom widgets
- [ ] Status messages announced

---

## Priority Areas

### 1. Forms

```typescript
// Proper labeling
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" aria-describedby="email-error" />
<p id="email-error" role="alert">Invalid email format</p>

// Error announcements
<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

### 2. Dialogs/Modals

```typescript
// Using Radix Dialog (already accessible)
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Dialog Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### 3. Navigation

```typescript
// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Landmark roles
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main id="main-content" role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

### 4. Data Visualizations

```typescript
// Charts need alternatives
<div role="img" aria-label="Bar chart showing conversion data for the past 7 days">
  <AnalyticsChart data={data} />
</div>

// Provide data table alternative
<details>
  <summary>View data as table</summary>
  <table>
    <caption>Conversion data for the past 7 days</caption>
    {/* Table content */}
  </table>
</details>
```

### 5. Toast Notifications

```typescript
// sonner already handles ARIA
// Verify: role="status" and aria-live="polite"
<Toaster richColors closeButton />
```

---

## Testing Scripts

### Automated Tests

```typescript
// __tests__/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page has no violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('dashboard has no violations', async ({ page }) => {
    await loginUser(page);
    await page.goto('/dashboard');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  // Test all major pages
  const pages = [
    '/dashboard/usage',
    '/dashboard/subscription',
    '/dashboard/analytics',
    '/dashboard/teams',
    '/dashboard/profile',
    '/dashboard/security',
    '/settings',
  ];

  for (const path of pages) {
    test(`${path} has no violations`, async ({ page }) => {
      await loginUser(page);
      await page.goto(path);

      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
```

### Manual Testing Checklist

1. **Keyboard navigation:**
   - Tab through entire page
   - Verify all interactive elements reachable
   - Check focus indicators visible
   - Test Escape closes modals

2. **Screen reader:**
   - All content announced
   - Headings navigable
   - Forms usable
   - Errors announced

3. **Zoom:**
   - 200% zoom no content loss
   - Text reflows properly

---

## Common Fixes

### Missing Alt Text
```typescript
// Before
<img src="/logo.png" />

// After
<img src="/logo.png" alt="Markdown to PDF Logo" />
```

### Missing Form Labels
```typescript
// Before
<input type="email" placeholder="Email" />

// After
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="Email" />
```

### Low Contrast
```typescript
// Before: text-gray-400 on white (2.5:1)
<p className="text-gray-400">Low contrast text</p>

// After: text-gray-600 on white (4.5:1)
<p className="text-gray-600">Accessible text</p>
```

### Missing Focus Indicators
```typescript
// Ensure focus-visible class
<Button className="focus-visible:ring-2 focus-visible:ring-offset-2">
  Click me
</Button>
```

---

## Files Modified ✅

### Layout & Navigation
1. ✅ `src/app/[locale]/layout.tsx` - Added skip link, main id, role="main"
2. ✅ `src/components/layout/Header.tsx` - Added aria-labels for navigation, aria-expanded, aria-controls

### Form Components
3. ✅ `src/components/security/PasswordChange.tsx` - Added aria-labels for visibility toggles, aria-describedby for errors, aria-invalid, role="alert" for error messages

### Translations
4. ✅ `src/messages/en.json` - Added showPassword/hidePassword labels
5. ✅ `src/messages/ar.json` - Added showPassword/hidePassword labels

### Tests
6. ✅ `__tests__/e2e/accessibility.spec.ts` - Added Skip Link tests, Navigation Accessibility tests, improved axe validation

### Already Compliant
- `src/components/dashboard/AnalyticsChart.tsx` - Already has excellent accessibility (role="img", aria-label, sr-only table alternative)
- `src/components/layout/Footer.tsx` - Already has sr-only text for icon links
- `src/components/layout/ThemeToggle.tsx` - Already has sr-only text

---

## Acceptance Criteria

- [x] Axe reports zero critical violations
- [ ] Lighthouse accessibility score ≥ 95 (pending manual verification)
- [x] All forms properly labeled
- [x] All images have alt text
- [x] Skip link implemented
- [x] Keyboard navigation works
- [ ] Screen reader tested (requires manual testing)
- [x] Color contrast passing (informational violations only)

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 6.1 status to ✅
2. Update progress bar
3. Add to completion log
