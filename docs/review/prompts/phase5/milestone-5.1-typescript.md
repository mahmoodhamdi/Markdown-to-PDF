# Milestone 5.1: TypeScript Strict Mode

## Status: ✅ Complete
## Priority: MEDIUM
## Estimated Scope: Large
## Completed: 2025-12-30

---

## Objective

Enable stricter TypeScript settings and fix all resulting type errors for better code quality.

---

## Current Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    // May not have all strict options enabled
  }
}
```

---

## Strict Options to Enable

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

---

## Common Issues to Fix

### 1. Implicit Any

```typescript
// Before: Implicit any
function processData(data) {
  return data.value;
}

// After: Explicit type
function processData(data: { value: string }): string {
  return data.value;
}
```

### 2. Null/Undefined Checks

```typescript
// Before: Potential null access
const user = await getUser(id);
console.log(user.name);

// After: Null check
const user = await getUser(id);
if (!user) {
  throw new Error('User not found');
}
console.log(user.name);
```

### 3. Array Index Access

```typescript
// Before: Unchecked index access
const items = ['a', 'b', 'c'];
const first = items[0].toUpperCase(); // Could be undefined

// After: Safe access
const items = ['a', 'b', 'c'];
const first = items[0];
if (first) {
  first.toUpperCase();
}
```

### 4. Error Handling

```typescript
// Before: Error is any
try {
  doSomething();
} catch (error) {
  console.log(error.message);
}

// After: Error is unknown
try {
  doSomething();
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

### 5. Function Return Types

```typescript
// Before: Implicit return type
function calculate(a: number, b: number) {
  if (a > b) {
    return a - b;
  }
  // Missing return
}

// After: Explicit return, all paths covered
function calculate(a: number, b: number): number {
  if (a > b) {
    return a - b;
  }
  return b - a;
}
```

---

## Priority Files

Start with most critical files:

1. **API Routes:** `src/app/api/**/*.ts`
2. **Services:** `src/lib/**/*.ts`
3. **Database Models:** `src/lib/db/models/*.ts`
4. **Type Definitions:** `src/types/*.ts`
5. **Components:** `src/components/**/*.tsx`

---

## Type Utilities to Add

```typescript
// src/types/utils.ts

// Ensure non-null
export function assertDefined<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
  return value;
}

// Type guard for error
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard for object with property
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is { [P in K]: unknown } {
  return typeof obj === 'object' && obj !== null && key in obj;
}
```

---

## Approach

### Phase 1: Enable Strict

Enable in tsconfig.json and count errors:
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

### Phase 2: Fix by Category

1. Fix all `any` types
2. Fix null checks
3. Fix return types
4. Fix unused variables
5. Fix index access

### Phase 3: Verify

```bash
npm run build
npm run lint
npm run test
```

---

## Files to Modify

1. `tsconfig.json`
2. All `.ts` and `.tsx` files with type errors
3. `src/types/utils.ts` (create)

---

## Testing

1. Build succeeds with no errors
2. All existing tests pass
3. No runtime regressions
4. Lint passes

---

## Acceptance Criteria

- [ ] All strict options enabled
- [ ] Zero TypeScript errors
- [ ] No `any` types (except where necessary)
- [ ] All functions have return types
- [ ] Null/undefined properly handled
- [ ] Build passes
- [ ] Tests pass

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 5.1 status to ✅
2. Update progress bar
3. Add to completion log
