# Milestone 1.3: Debug Flags & Hardcoded Values Cleanup

## Status: ⬜ Not Started
## Priority: HIGH
## Estimated Scope: Small

---

## Objective

Remove debug flags, hardcoded values, and TODO comments that shouldn't be in production code.

---

## Issues to Fix

### Issue 1: DEBUG Flag in PDF Templates
**File:** `src/lib/pdf/templates.ts`
**Line:** ~347

```typescript
// Current:
DEBUG=true  // or similar debug flag

// Fix: Remove or use environment variable
const DEBUG = process.env.NODE_ENV === 'development';
```

### Issue 2: Hardcoded Plan Limits in Dashboard
**File:** `src/app/[locale]/dashboard/page.tsx`
**Lines:** 39-46

```typescript
// Current (likely hardcoded):
const limits = {
  conversions: 10,
  apiCalls: 100,
  // ...
};

// Fix: Use getPlanLimits() utility
import { getPlanLimits } from '@/lib/plans/config';
const limits = getPlanLimits(session.user.plan);
```

### Issue 3: TODO Comments Review

Search for and address any TODO comments:
```bash
# Search pattern
grep -r "TODO" src/ --include="*.ts" --include="*.tsx"
grep -r "FIXME" src/ --include="*.ts" --include="*.tsx"
grep -r "HACK" src/ --include="*.ts" --include="*.tsx"
grep -r "XXX" src/ --include="*.ts" --include="*.tsx"
```

---

## Search Commands

Run these to find all issues:

```bash
# Debug flags
grep -rn "DEBUG\s*=" src/
grep -rn "debug\s*:\s*true" src/
grep -rn "console.log" src/lib/ src/app/api/

# Hardcoded values that should be dynamic
grep -rn "localhost:3000" src/
grep -rn "127.0.0.1" src/

# TODO/FIXME comments
grep -rn "TODO" src/
grep -rn "FIXME" src/
```

---

## Cleanup Rules

### Console.log Statements
- **Keep:** Error logging with `console.error()`
- **Remove:** Debug `console.log()` statements
- **Replace:** Use proper logging if needed

### Debug Flags
- **Remove:** `DEBUG = true`
- **Replace with:** `process.env.NODE_ENV === 'development'`

### Hardcoded URLs
- **Remove:** `http://localhost:3000`
- **Replace with:** `process.env.NEXT_PUBLIC_APP_URL`

### Magic Numbers
- **Remove:** Hardcoded limits like `10`, `100`, `1000`
- **Replace with:** Constants or config values

---

## Files to Check

Priority files to review:
1. `src/lib/pdf/templates.ts`
2. `src/lib/pdf/generator.ts`
3. `src/app/[locale]/dashboard/page.tsx`
4. `src/app/[locale]/dashboard/usage/page.tsx`
5. `src/lib/plans/config.ts`
6. All API routes in `src/app/api/`

---

## Testing

After cleanup:
1. Run `npm run build` - ensure no build errors
2. Run `npm run lint` - fix any linting issues
3. Run `npm run test` - all tests still pass
4. Manual test the affected features

---

## Acceptance Criteria

- [ ] No DEBUG=true flags in code
- [ ] No hardcoded localhost URLs
- [ ] No unnecessary console.log statements
- [ ] All plan limits use getPlanLimits()
- [ ] TODO comments addressed or documented
- [ ] Build passes without errors
- [ ] Tests pass
- [ ] Lint passes

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 1.3 status to ✅
2. Update progress bar
3. Add to completion log
