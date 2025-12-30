# Milestone 5.2: Component Testing

## Status: ✅ Complete
## Priority: MEDIUM
## Estimated Scope: Large
## Completed: 2025-12-30

---

## Objective

Increase component test coverage to 80%+ for critical UI components.

---

## Current Test Structure

- **Location:** `__tests__/unit/components/`
- **Framework:** Vitest + React Testing Library
- **Setup:** `src/test/setup.ts`

---

## Components to Test

### Priority 1: Dashboard Components

| Component | Current Coverage | Target | Status |
|-----------|-----------------|--------|--------|
| DashboardOverview | ✅ Complete | 80% | ✅ |
| DashboardSidebar | ✅ Complete | 80% | ✅ |
| QuickStats | ✅ Complete | 80% | ✅ |
| UsageProgress | ✅ Complete | 80% | ✅ |
| UsageStats | ✅ Complete | 80% | ✅ |
| UsageHistory | ✅ Complete | 80% | ✅ |
| CurrentPlan | ✅ Complete | 80% | ✅ |
| PlanComparison | ✅ Complete | 80% | ✅ |
| BillingHistory | ✅ Complete | 80% | ✅ |
| AnalyticsChart | ✅ Complete | 70% | ✅ |

### Priority 2: Editor Components

| Component | Current Coverage | Target | Status |
|-----------|-----------------|--------|--------|
| MarkdownEditor | ✅ Complete | 70% | ✅ |
| EditorToolbar | ✅ Complete | 80% | ✅ |
| FileUpload | ✅ Complete | 80% | ✅ |
| RecoveryPrompt | ✅ Complete | 80% | ✅ |

### Priority 3: Form Components

| Component | Current Coverage | Target | Status |
|-----------|-----------------|--------|--------|
| PasswordChange | ✅ Complete | 80% | ✅ |
| ProfileForm | ✅ Complete | 80% | ✅ |
| CreateTeamDialog | ✅ Complete | 80% | ✅ |
| AddMemberDialog | ✅ Complete | 80% | ✅ |

---

## Test Patterns

### Basic Render Test

```typescript
// __tests__/unit/components/dashboard/QuickStats.test.tsx
import { render, screen } from '@testing-library/react';
import { QuickStats } from '@/components/dashboard/QuickStats';

describe('QuickStats', () => {
  const defaultProps = {
    conversions: 10,
    apiCalls: 50,
    storage: { used: 512, limit: 1024 },
    plan: 'pro' as const,
  };

  it('renders all stat cards', () => {
    render(<QuickStats {...defaultProps} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('shows storage percentage', () => {
    render(<QuickStats {...defaultProps} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
```

### User Interaction Test

```typescript
// __tests__/unit/components/dashboard/PlanComparison.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanComparison } from '@/components/dashboard/PlanComparison';

describe('PlanComparison', () => {
  it('toggles between monthly and yearly', async () => {
    const user = userEvent.setup();
    render(<PlanComparison currentPlan="free" onSelectPlan={vi.fn()} />);

    // Default is monthly
    expect(screen.getByText('$5/mo')).toBeInTheDocument();

    // Click yearly toggle
    await user.click(screen.getByRole('switch'));

    // Prices should change
    expect(screen.getByText('$50/yr')).toBeInTheDocument();
  });

  it('calls onSelectPlan when upgrade clicked', async () => {
    const user = userEvent.setup();
    const onSelectPlan = vi.fn();
    render(<PlanComparison currentPlan="free" onSelectPlan={onSelectPlan} />);

    await user.click(screen.getByRole('button', { name: /upgrade to pro/i }));

    expect(onSelectPlan).toHaveBeenCalledWith('pro');
  });
});
```

### Async Data Test

```typescript
// __tests__/unit/components/dashboard/UsageHistory.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UsageHistory } from '@/components/dashboard/UsageHistory';

describe('UsageHistory', () => {
  const mockData = [
    { date: '2024-01-01', conversions: 5, apiCalls: 20 },
    { date: '2024-01-02', conversions: 10, apiCalls: 30 },
  ];

  it('shows loading state', () => {
    render(<UsageHistory data={[]} loading={true} />);

    expect(screen.getByTestId('usage-history-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<UsageHistory data={[]} loading={false} />);

    expect(screen.getByText(/no usage data/i)).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<UsageHistory data={mockData} loading={false} />);

    expect(screen.getByRole('img', { name: /usage chart/i })).toBeInTheDocument();
  });
});
```

### Form Validation Test

```typescript
// __tests__/unit/components/security/PasswordChange.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordChange } from '@/components/security/PasswordChange';

describe('PasswordChange', () => {
  it('shows validation errors', async () => {
    const user = userEvent.setup();
    render(<PasswordChange />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    render(<PasswordChange />);

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });
});
```

---

## Mocking Patterns

### Mock API Calls

```typescript
// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
) as jest.Mock;
```

### Mock NextAuth Session

```typescript
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: '1', email: 'test@test.com', plan: 'pro' },
    },
    status: 'authenticated',
  }),
}));
```

### Mock Router

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));
```

---

## Files Created ✅

1. ✅ `__tests__/unit/components/dashboard/UsageHistory.test.tsx`
2. ✅ `__tests__/unit/components/dashboard/AnalyticsChart.test.tsx`
3. ✅ `__tests__/unit/components/editor/MarkdownEditor.test.tsx`
4. ✅ `__tests__/unit/components/editor/EditorToolbar.test.tsx`
5. ✅ `__tests__/unit/components/security/PasswordChange.test.tsx`
6. ✅ `__tests__/unit/components/profile/ProfileForm.test.tsx`
7. ✅ `__tests__/unit/components/teams/CreateTeamDialog.test.tsx`
8. ✅ `__tests__/unit/components/teams/AddMemberDialog.test.tsx`

---

## Running Tests

```bash
# Run all component tests
npm run test:unit -- --coverage

# Run specific test file
npx vitest run __tests__/unit/components/dashboard/QuickStats.test.tsx

# Run with watch
npx vitest __tests__/unit/components/
```

---

## Acceptance Criteria

- [x] All Priority 1 components have tests
- [x] All Priority 2 components have tests
- [x] Coverage > 80% for tested components
- [x] All tests pass (1798 tests across 93 files)
- [x] No flaky tests
- [x] data-testid attributes added where needed
- [x] Test setup includes jsdom polyfills for Radix UI components

---

## Completion Checklist

- [x] All test files created and passing
- [x] Milestone status updated to ✅ Complete

### Fixes Applied

1. **EditorToolbar.tsx** - Added `aria-label` to buttons for accessibility
2. **AddMemberDialog.tsx** - Added `useEffect` for form reset on close, added `noValidate` to form
3. **MarkdownEditor.test.tsx** - Fixed Monaco mock timing with `queueMicrotask`
4. **ProfileForm.test.tsx** - Fixed `vi.hoisted()` for mockToast
5. **AddMemberDialog.test.tsx** - Fixed `vi.hoisted()` for mockToast, updated label queries
6. **src/test/setup.ts** - Added jsdom polyfills for Radix UI (hasPointerCapture, scrollIntoView, etc.)
