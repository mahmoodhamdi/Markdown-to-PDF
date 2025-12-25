# Stage 2.2: Table of Contents Display

**Phase:** 2 - UI/UX Completion
**Priority:** 🟠 High
**Estimated Effort:** Small

---

## Context

Table of Contents functionality is partially implemented:
- `TableOfContents.tsx` component exists
- TOC data is extracted in `parseMarkdownFull()`
- Not rendered in the UI

### Current State

- Component: `src/components/preview/TableOfContents.tsx`
- Parser extracts headings: `src/lib/markdown/parser.ts`
- Editor store has `showToc` state
- No toggle button in UI

---

## Task Requirements

### 1. Add TOC Toggle Button

**File to modify:** `src/components/preview/MarkdownPreview.tsx`

Add a toggle button in the preview panel header:

```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => toggleToc()}
  aria-label={showToc ? 'Hide table of contents' : 'Show table of contents'}
>
  <List className="h-4 w-4" />
</Button>
```

### 2. Render TOC Sidebar

**File to modify:** `src/components/preview/MarkdownPreview.tsx`

Add collapsible TOC sidebar:

```tsx
<div className="flex h-full">
  {showToc && (
    <aside className="w-64 border-r overflow-y-auto p-4">
      <TableOfContents headings={headings} onHeadingClick={scrollToHeading} />
    </aside>
  )}
  <div className="flex-1 overflow-y-auto">
    {/* Existing preview content */}
  </div>
</div>
```

### 3. Implement Scroll to Heading

**File to modify:** `src/components/preview/TableOfContents.tsx`

Add smooth scroll navigation:

```typescript
function scrollToHeading(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

### 4. Extract Headings from Content

**File to modify:** `src/app/[locale]/page.tsx` or parent component

Parse headings when content changes:

```typescript
const { html, headings } = useMemo(() => {
  return parseMarkdownFull(content);
}, [content]);
```

### 5. Add Active Heading Highlight

Track which heading is currently in view:

```typescript
function useActiveHeading(headings: Heading[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/preview/MarkdownPreview.tsx` | Modify |
| `src/components/preview/TableOfContents.tsx` | Complete |
| `src/stores/editor-store.ts` | Add toggleToc action |
| `src/app/[locale]/page.tsx` | Pass headings prop |

---

## Visual Design

### TOC Sidebar

```
┌──────────────────────────────────────────────────────────────┐
│ [TOC] Preview                                        [🖨️] [⬇️]│
├────────────────────┬─────────────────────────────────────────┤
│ Table of Contents  │                                         │
│ ───────────────────│  # Heading 1                            │
│ ● Heading 1        │                                         │
│   ○ Subheading 1.1 │  Content here...                        │
│   ○ Subheading 1.2 │                                         │
│ ○ Heading 2        │  ## Subheading 1.1                      │
│   ○ Subheading 2.1 │                                         │
│ ○ Heading 3        │  More content...                        │
│                    │                                         │
└────────────────────┴─────────────────────────────────────────┘
```

### TOC Item Styles

```css
.toc-item {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.toc-item:hover {
  background: var(--muted);
}

.toc-item.active {
  background: var(--primary);
  color: var(--primary-foreground);
}

.toc-item[data-level="2"] { padding-left: 16px; }
.toc-item[data-level="3"] { padding-left: 32px; }
.toc-item[data-level="4"] { padding-left: 48px; }
```

---

## Testing Requirements

### Unit Tests

**File to modify:** `__tests__/unit/components/preview/TableOfContents.test.tsx`

Test cases:
- [ ] Renders all headings
- [ ] Indents based on heading level
- [ ] Calls onHeadingClick when clicked
- [ ] Highlights active heading
- [ ] Handles empty headings array

### E2E Tests

**File to add tests:** `__tests__/e2e/preview.spec.ts`

Test cases:
- [ ] TOC toggle button shows/hides sidebar
- [ ] Clicking heading scrolls to it
- [ ] Active heading updates on scroll
- [ ] TOC persists after page reload

---

## Translations

Add to `src/messages/en.json`:
```json
{
  "preview": {
    "toc": {
      "title": "Table of Contents",
      "show": "Show table of contents",
      "hide": "Hide table of contents",
      "empty": "No headings found"
    }
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] TOC toggle button in preview header
- [ ] TOC sidebar renders correctly
- [ ] Headings are clickable and scroll to position
- [ ] Active heading is highlighted
- [ ] TOC state persists in store
- [ ] Responsive design (hides on mobile)
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Translations added (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Implementation Notes

1. **Heading IDs:** Ensure markdown parser generates consistent heading IDs
2. **Nested Headings:** Handle up to 6 levels (h1-h6)
3. **Long Titles:** Truncate with ellipsis
4. **Mobile:** Hide TOC by default on small screens
5. **Keyboard:** Add keyboard navigation support

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 2.2 status to ✅ Complete*
