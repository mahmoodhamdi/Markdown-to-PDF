# Stage 3.1: Dashboard Layout

**Phase:** 3 - User Dashboard
**Priority:** 🟠 High
**Estimated Effort:** Medium

---

## Context

Users need a central dashboard to manage their account, view usage, and manage subscriptions.

---

## Task Requirements

### 1. Create Dashboard Page

**File to create:** `src/app/[locale]/dashboard/page.tsx`

### 2. Create Dashboard Layout

**File to create:** `src/app/[locale]/dashboard/layout.tsx`

```tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="container py-8">
      <div className="flex gap-8">
        <DashboardSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
```

### 3. Create Dashboard Sidebar

**File to create:** `src/components/dashboard/DashboardSidebar.tsx`

Navigation items:
- Overview
- Usage
- Subscription
- Files
- Analytics
- Settings

### 4. Create Dashboard Overview

**File to create:** `src/components/dashboard/DashboardOverview.tsx`

Content:
- Welcome message with user name
- Quick stats (conversions today, storage used)
- Current plan badge
- Quick actions (Convert, Upload, etc.)

---

## Files to Create

| File | Action |
|------|--------|
| `src/app/[locale]/dashboard/page.tsx` | Create |
| `src/app/[locale]/dashboard/layout.tsx` | Create |
| `src/components/dashboard/DashboardSidebar.tsx` | Create |
| `src/components/dashboard/DashboardOverview.tsx` | Create |
| `src/components/dashboard/QuickStats.tsx` | Create |

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Dashboard                                                    │
├────────────────────┬─────────────────────────────────────────┤
│                    │                                         │
│ ● Overview         │  Welcome back, John!                    │
│ ○ Usage            │                                         │
│ ○ Subscription     │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ ○ Files            │  │ 15/20   │ │ 50MB    │ │ Pro     │   │
│ ○ Analytics        │  │ Today   │ │ Used    │ │ Plan    │   │
│                    │  └─────────┘ └─────────┘ └─────────┘   │
│ ─────────────────  │                                         │
│ ○ Settings         │  Quick Actions                          │
│                    │  [New Document] [Upload] [Templates]    │
│                    │                                         │
└────────────────────┴─────────────────────────────────────────┘
```

---

## Testing Requirements

- [ ] Dashboard page loads correctly
- [ ] Sidebar navigation works
- [ ] Overview shows user stats
- [ ] Responsive design on mobile
- [ ] Requires authentication

---

## Definition of Done

- [ ] Dashboard layout created
- [ ] Sidebar navigation works
- [ ] Overview displays user info
- [ ] Protected route (requires auth)
- [ ] Translations added (EN & AR)
- [ ] Unit tests pass
- [ ] E2E tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 3.1 status to ✅ Complete*
