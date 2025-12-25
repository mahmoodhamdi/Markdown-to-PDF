# Stage 3.4: Analytics Dashboard

**Phase:** 3 - User Dashboard
**Priority:** 🟠 High
**Estimated Effort:** Medium

---

## Context

Analytics service exists but no UI to view analytics. Users need visual insights into their usage patterns.

---

## Task Requirements

### 1. Create Analytics Page

**File to create:** `src/app/[locale]/dashboard/analytics/page.tsx`

### 2. Create Analytics Components

**Files to create:**
- `src/components/dashboard/AnalyticsChart.tsx` - Line/bar charts
- `src/components/dashboard/ConversionStats.tsx` - Conversion metrics
- `src/components/dashboard/ThemeUsage.tsx` - Most used themes
- `src/components/dashboard/TemplateUsage.tsx` - Most used templates

### 3. Use Existing APIs

**Existing endpoints:**
- `GET /api/analytics/summary` - Today, week, month stats
- `GET /api/analytics/history` - Historical data

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Analytics                              [This Week ▼]         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Conversions ────────────────────────────────────────────┐ │
│ │         │                                                 │ │
│ │     200 │    ▄▄                                          │ │
│ │         │ ▄▄ ██                                          │ │
│ │     100 │ ██ ██ ▄▄    ▄▄                                 │ │
│ │         │ ██ ██ ██ ▄▄ ██                                 │ │
│ │       0 ├─Mon─Tue─Wed─Thu─Fri─Sat─Sun─                   │ │
│ │         │                                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Top Themes ─────────────────────────────────────────────┐ │
│ │ 1. GitHub     ████████████████████  45%                  │ │
│ │ 2. Academic   ████████████  28%                          │ │
│ │ 3. Minimal    ████████  18%                              │ │
│ │ 4. Other      ████  9%                                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Top Templates ──────────────────────────────────────────┐ │
│ │ 1. Resume        32 uses                                 │ │
│ │ 2. Meeting Notes 28 uses                                 │ │
│ │ 3. README        15 uses                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Export Data (CSV)]                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Chart Library

Use a lightweight chart library:
- **Recommended:** `recharts` (already React-based)
- **Alternative:** Simple CSS bars for basic charts

---

## Testing Requirements

- [ ] Analytics page loads
- [ ] Charts render with data
- [ ] Date range filter works
- [ ] Export functionality works

---

## Definition of Done

- [ ] Analytics page created
- [ ] Charts display correctly
- [ ] Theme usage shown
- [ ] Template usage shown
- [ ] Export to CSV works
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 3.4 status to ✅ Complete*
