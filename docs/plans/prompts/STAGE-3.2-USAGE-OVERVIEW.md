# Stage 3.2: Usage Overview

**Phase:** 3 - User Dashboard
**Priority:** 🟠 High
**Estimated Effort:** Medium

---

## Context

Users need to see their usage statistics against their plan limits.

---

## Task Requirements

### 1. Create Usage Page

**File to create:** `src/app/[locale]/dashboard/usage/page.tsx`

### 2. Create Usage Components

**Files to create:**
- `src/components/dashboard/UsageStats.tsx` - Current usage stats
- `src/components/dashboard/UsageProgress.tsx` - Progress bars
- `src/components/dashboard/UsageHistory.tsx` - Usage over time

### 3. API Endpoint

**File to use:** `/api/analytics/summary` (already exists)

### 4. Display Metrics

- Conversions today / limit
- API calls today / limit
- Storage used / limit
- Files uploaded / limit
- Reset date/time

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Usage                                             [Pro Plan] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Today's Usage                           Resets in 8 hours    │
│                                                              │
│ Conversions    ████████████░░░░░░░░░░░░░░░░  45/100         │
│ API Calls      ███████░░░░░░░░░░░░░░░░░░░░░  35/200         │
│                                                              │
│ Storage                                                      │
│ ██████████████████░░░░░░░░░░░░░░░░░░░░  512MB / 1GB         │
│                                                              │
│ ┌─ This Week ─────────────────────────────────────────────┐ │
│ │ [Chart showing daily conversions]                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Requirements

- [ ] Usage stats display correctly
- [ ] Progress bars show accurate percentages
- [ ] Reset time calculated correctly
- [ ] History chart renders

---

## Definition of Done

- [ ] Usage page created
- [ ] Stats fetched from API
- [ ] Progress bars work
- [ ] History displayed
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 3.2 status to ✅ Complete*
