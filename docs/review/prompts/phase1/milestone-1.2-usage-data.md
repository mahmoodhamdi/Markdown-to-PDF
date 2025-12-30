# Milestone 1.2: Usage Page Data Integration

## Status: ⬜ Not Started
## Priority: HIGH
## Estimated Scope: Small

---

## Objective

Fix the hardcoded/mock data in the Usage page and integrate real data from APIs.

---

## Current Issues

### Issue 1: Hardcoded Storage Data
**File:** `src/app/[locale]/dashboard/usage/page.tsx`
**Lines:** 34-35

```typescript
// Current (hardcoded):
storageUsed: 0,
filesUploaded: 0,
```

**Fix:** Fetch from `/api/storage/quota`

### Issue 2: Mock History Data
**File:** `src/app/[locale]/dashboard/usage/page.tsx`
**Lines:** 48-60

```typescript
// Current (mock data):
const mockHistory = [
  { date: '2024-01-01', conversions: 5, apiCalls: 20 },
  // ... hardcoded values
];
```

**Fix:** Fetch from `/api/analytics/history`

---

## Implementation Steps

### Step 1: Add Storage Quota Fetch

```typescript
// Add to page component
const [storageData, setStorageData] = useState({
  used: 0,
  limit: 0,
  filesCount: 0
});

useEffect(() => {
  async function fetchStorageQuota() {
    const res = await fetch('/api/storage/quota');
    if (res.ok) {
      const data = await res.json();
      setStorageData({
        used: data.used,
        limit: data.limit,
        filesCount: data.filesCount || 0
      });
    }
  }
  fetchStorageQuota();
}, []);
```

### Step 2: Replace Mock History with API Data

```typescript
// Add to page component
const [historyData, setHistoryData] = useState([]);
const [historyLoading, setHistoryLoading] = useState(true);

useEffect(() => {
  async function fetchHistory() {
    setHistoryLoading(true);
    const res = await fetch('/api/analytics/history?days=7');
    if (res.ok) {
      const data = await res.json();
      setHistoryData(data.history);
    }
    setHistoryLoading(false);
  }
  fetchHistory();
}, []);
```

### Step 3: Update UsageHistory Component

Pass real data instead of mock:
```typescript
<UsageHistory
  data={historyData}
  loading={historyLoading}
/>
```

---

## API Endpoints Used

### Storage Quota
```
GET /api/storage/quota
Response: {
  used: number,      // bytes used
  limit: number,     // bytes limit
  remaining: number, // bytes remaining
  percentage: number // 0-100
}
```

### Analytics History
```
GET /api/analytics/history?days=7
Response: {
  history: [
    {
      date: "2024-01-01",
      conversions: 5,
      apiCalls: 20,
      uploads: 2,
      downloads: 3
    },
    ...
  ]
}
```

---

## Files to Modify

1. `src/app/[locale]/dashboard/usage/page.tsx`
2. `src/components/dashboard/UsageHistory.tsx` (if props need updating)

---

## Testing

### Verify:
1. Storage quota displays real values
2. History chart shows real data
3. Loading states work correctly
4. Error states handled gracefully
5. Empty state for new users (no history)

---

## Acceptance Criteria

- [ ] Storage quota fetched from API
- [ ] Files count displayed correctly
- [ ] 7-day history fetched from API
- [ ] Loading states during data fetch
- [ ] Error handling for failed requests
- [ ] Empty state for users with no history
- [ ] No hardcoded/mock data remaining

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 1.2 status to ✅
2. Update progress bar
3. Add to completion log
