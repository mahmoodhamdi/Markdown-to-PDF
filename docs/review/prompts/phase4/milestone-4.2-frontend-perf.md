# Milestone 4.2: Frontend Performance Optimization

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Medium

---

## Objective

Optimize frontend performance for faster page loads and smoother interactions.

---

## Performance Audit Areas

### 1. Bundle Size Analysis

**Run analysis:**
```bash
npm run build
npx @next/bundle-analyzer
```

**Check for:**
- Large dependencies
- Duplicate packages
- Unused code

**Common issues:**
- Monaco Editor (large)
- Mermaid (large)
- Lodash (should tree-shake)

### 2. Code Splitting

**Implement dynamic imports:**

```typescript
// Before: Static import
import { MonacoEditor } from '@/components/editor/MonacoEditor';

// After: Dynamic import
const MonacoEditor = dynamic(
  () => import('@/components/editor/MonacoEditor'),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
);
```

**Components to lazy load:**
- Monaco Editor
- Mermaid renderer
- PDF preview
- Dashboard charts
- Settings dialogs

### 3. Image Optimization

**Use Next.js Image:**

```typescript
// Before
<img src="/logo.png" alt="Logo" />

// After
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={40} priority />
```

**Optimize:**
- Use WebP format
- Proper sizing
- Lazy loading for below-fold
- Priority for LCP images

### 4. Component Memoization

**Add React.memo where appropriate:**

```typescript
// Before
export function ExpensiveComponent({ data }) {
  return <div>{/* complex rendering */}</div>;
}

// After
export const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* complex rendering */}</div>;
});
```

**Use useMemo/useCallback:**

```typescript
// Memoize expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransform(item));
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 5. Virtualization

For long lists:

```typescript
import { FixedSizeList } from 'react-window';

// Virtualized file list
<FixedSizeList
  height={400}
  itemCount={files.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      <FileRow file={files[index]} />
    </div>
  )}
</FixedSizeList>
```

### 6. API Response Caching

**Use SWR or React Query:**

```typescript
import useSWR from 'swr';

function useUserProfile() {
  return useSWR('/api/users/profile', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });
}
```

### 7. Prefetching

**Link prefetching:**

```typescript
import Link from 'next/link';

// Next.js auto-prefetches visible links
<Link href="/dashboard" prefetch>Dashboard</Link>

// Manual prefetch
router.prefetch('/dashboard/analytics');
```

**Data prefetching:**

```typescript
// Prefetch on hover
<Button
  onMouseEnter={() => mutate('/api/analytics/summary')}
  onClick={() => router.push('/dashboard/analytics')}
>
  View Analytics
</Button>
```

---

## Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | > 90 |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |

---

## Specific Optimizations

### Monaco Editor

```typescript
// Load only needed languages
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => {
    // Configure before use
    mod.loader.config({
      paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' },
    });
    return mod.default;
  }),
  { ssr: false }
);
```

### Mermaid

```typescript
// Lazy load mermaid
const renderMermaid = async (code: string) => {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({ startOnLoad: false });
  return mermaid.render('mermaid-svg', code);
};
```

### Charts

```typescript
// Use lightweight chart library or lazy load
const AnalyticsChart = dynamic(
  () => import('@/components/dashboard/AnalyticsChart'),
  { loading: () => <ChartSkeleton /> }
);
```

---

## Files to Modify

1. `src/components/editor/MarkdownEditor.tsx` - Lazy load Monaco
2. `src/components/preview/MarkdownPreview.tsx` - Lazy load Mermaid
3. `src/app/[locale]/dashboard/analytics/page.tsx` - Lazy load charts
4. `next.config.js` - Bundle analyzer, optimization config
5. All image usages - Use next/image

---

## Testing

1. Run Lighthouse audit before/after
2. Check bundle size changes
3. Test on slow network (3G throttle)
4. Test on low-end device

---

## Acceptance Criteria

- [ ] Lighthouse performance > 90
- [ ] Monaco editor lazy loaded
- [ ] Mermaid lazy loaded
- [ ] Charts lazy loaded
- [ ] Images optimized
- [ ] Long lists virtualized
- [ ] API responses cached
- [ ] Bundle size reduced

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 4.2 status to ✅
2. Update progress bar
3. Add to completion log
