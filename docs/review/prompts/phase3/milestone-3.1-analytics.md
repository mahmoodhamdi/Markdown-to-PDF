# Milestone 3.1: Analytics Components Enhancement

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Medium

---

## Objective

Polish and enhance the analytics dashboard components for better data visualization and user experience.

---

## Current Components

1. `src/components/dashboard/AnalyticsChart.tsx` - Line/bar chart
2. `src/components/dashboard/ConversionStats.tsx` - Stats cards
3. `src/components/dashboard/ThemeUsage.tsx` - Theme breakdown
4. `src/components/dashboard/TemplateUsage.tsx` - Template breakdown

---

## Enhancement Areas

### 1. AnalyticsChart Improvements

**Current Issues:**
- Basic bar chart without interactivity
- No responsive design for mobile
- Missing accessibility (aria labels)

**Enhancements:**

```typescript
// Add ARIA support
<div
  role="img"
  aria-label={`Analytics chart showing ${data.length} days of data`}
>
  {/* Chart content */}
</div>

// Add responsive breakpoints
const chartHeight = isMobile ? 200 : 300;

// Add tooltips with details
<Tooltip>
  <div className="p-2 bg-white rounded shadow">
    <p className="font-bold">{date}</p>
    <p>Conversions: {conversions}</p>
    <p>API Calls: {apiCalls}</p>
  </div>
</Tooltip>
```

### 2. ConversionStats Improvements

**Enhancements:**
- Add trend indicators (↑ 12% vs last week)
- Add sparkline mini-charts
- Add loading skeleton
- Improve mobile layout

```typescript
// Add trend calculation
const trend = calculateTrend(currentValue, previousValue);

// Display
<div className="flex items-center gap-1">
  <span>{value}</span>
  {trend > 0 && <span className="text-green-500">↑ {trend}%</span>}
  {trend < 0 && <span className="text-red-500">↓ {Math.abs(trend)}%</span>}
</div>
```

### 3. ThemeUsage Enhancement

**Current:** Simple percentage bars
**Improve:**
- Add actual usage counts
- Sort by usage (most used first)
- Add theme preview thumbnails
- Color-code by theme

### 4. TemplateUsage Enhancement

Similar to ThemeUsage:
- Show usage counts
- Sort by popularity
- Add template icons
- Link to template page

---

## New Components to Add

### 1. DateRangePicker

Replace basic dropdown with proper date picker:

```typescript
// src/components/dashboard/DateRangePicker.tsx
interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: Array<{ label: string; days: number }>;
}

// Presets: Last 7 days, Last 14 days, Last 30 days, Custom
```

### 2. ExportDialog

Allow CSV/JSON export:

```typescript
// src/components/dashboard/ExportDialog.tsx
interface ExportDialogProps {
  data: AnalyticsData;
  onExport: (format: 'csv' | 'json') => void;
}
```

### 3. AnalyticsSummaryCard

Quick summary at top of page:

```typescript
// Shows: Total conversions this month, Most used theme, Peak usage day
```

---

## Data Fetching Improvements

### Add SWR for caching:

```typescript
import useSWR from 'swr';

function useAnalytics(days: number) {
  const { data, error, isLoading } = useSWR(
    `/api/analytics/history?days=${days}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return { data, error, isLoading };
}
```

---

## Mobile Responsiveness

```typescript
// Current: Fixed grid
<div className="grid grid-cols-4 gap-4">

// Improved: Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Charts on mobile
<div className="w-full overflow-x-auto">
  <div className="min-w-[600px]">
    <AnalyticsChart data={data} />
  </div>
</div>
```

---

## Accessibility Improvements

1. **Charts:**
   - Add `role="img"` with `aria-label`
   - Provide data table alternative
   - Keyboard-navigable tooltips

2. **Stats:**
   - Screen reader announcements for trends
   - Proper heading hierarchy

3. **Filters:**
   - Label all form controls
   - Keyboard navigation

---

## Files to Create/Modify

### Create:
1. `src/components/dashboard/DateRangePicker.tsx`
2. `src/components/dashboard/ExportDialog.tsx`
3. `src/components/dashboard/AnalyticsSummaryCard.tsx`

### Modify:
1. `src/components/dashboard/AnalyticsChart.tsx`
2. `src/components/dashboard/ConversionStats.tsx`
3. `src/components/dashboard/ThemeUsage.tsx`
4. `src/components/dashboard/TemplateUsage.tsx`
5. `src/app/[locale]/dashboard/analytics/page.tsx`

---

## Testing

1. Charts render correctly with data
2. Charts handle empty data
3. Responsive layouts work
4. Export functionality works
5. Date range changes update data

---

## Acceptance Criteria

- [ ] Charts are accessible
- [ ] Mobile responsive
- [ ] Trends displayed on stats
- [ ] Date range picker works
- [ ] Export to CSV works
- [ ] Loading states
- [ ] Empty states
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 3.1 status to ✅
2. Update progress bar
3. Add to completion log
