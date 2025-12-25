# Stage 2.3: Fullscreen Mode Implementation

**Phase:** 2 - UI/UX Completion
**Priority:** 🟠 High
**Estimated Effort:** Small

---

## Context

Fullscreen mode state exists but is not implemented:
- `isFullscreen` state in editor store
- `toggleFullscreen` action exists
- No UI implementation

### Current State

- Editor store: `src/stores/editor-store.ts` has fullscreen state
- Toolbar may have button but it doesn't work
- No fullscreen CSS styles

---

## Task Requirements

### 1. Add Fullscreen CSS Styles

**File to modify:** `src/app/globals.css`

```css
/* Fullscreen mode */
.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: var(--background);
}

.fullscreen-mode .editor-container {
  height: 100vh;
}

/* Hide header and footer in fullscreen */
body.fullscreen-active header,
body.fullscreen-active footer {
  display: none;
}
```

### 2. Apply Fullscreen Styles

**File to modify:** `src/app/[locale]/page.tsx`

```tsx
const { isFullscreen, toggleFullscreen } = useEditorStore();

useEffect(() => {
  if (isFullscreen) {
    document.body.classList.add('fullscreen-active');
  } else {
    document.body.classList.remove('fullscreen-active');
  }
  return () => document.body.classList.remove('fullscreen-active');
}, [isFullscreen]);

return (
  <main className={cn('container', isFullscreen && 'fullscreen-mode')}>
    {/* Editor content */}
  </main>
);
```

### 3. Add Fullscreen Toggle Button

**File to modify:** `src/components/editor/EditorToolbar.tsx`

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 4. Add Exit Fullscreen Overlay

Show a hint to exit fullscreen:

```tsx
{isFullscreen && (
  <div className="fixed top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
    <Button variant="outline" size="sm" onClick={toggleFullscreen}>
      <Minimize2 className="h-4 w-4 mr-2" />
      {t('exitFullscreen')}
    </Button>
  </div>
)}
```

### 5. Add Keyboard Shortcut

**File to modify:** `src/app/[locale]/page.tsx`

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // F11 or Escape to toggle/exit fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
    if (e.key === 'Escape' && isFullscreen) {
      toggleFullscreen();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isFullscreen, toggleFullscreen]);
```

### 6. Use Native Fullscreen API (Optional Enhancement)

```typescript
async function enterNativeFullscreen() {
  try {
    await document.documentElement.requestFullscreen();
    toggleFullscreen();
  } catch (err) {
    // Fallback to CSS fullscreen
    toggleFullscreen();
  }
}

function exitNativeFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  toggleFullscreen();
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/app/globals.css` | Add fullscreen styles |
| `src/app/[locale]/page.tsx` | Apply fullscreen class |
| `src/components/editor/EditorToolbar.tsx` | Add toggle button |
| `src/stores/editor-store.ts` | Verify state exists |

---

## Visual Design

### Normal Mode
```
┌──────────────────────────────────────────────────────────────┐
│ Header                                               [□]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Editor                                                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer                                                       │
└──────────────────────────────────────────────────────────────┘
```

### Fullscreen Mode
```
┌──────────────────────────────────────────────────────────────┐
│                                            [Exit Fullscreen] │
│                                                              │
│  Editor (Full Height)                                        │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Requirements

### Unit Tests

**File:** `__tests__/unit/stores/editor-store.test.ts`

Test cases:
- [ ] toggleFullscreen toggles state
- [ ] Initial state is not fullscreen

### E2E Tests

**File to add tests:** `__tests__/e2e/editor.spec.ts`

Test cases:
- [ ] Click fullscreen button enters fullscreen
- [ ] Click exit button exits fullscreen
- [ ] F11 toggles fullscreen
- [ ] Escape exits fullscreen
- [ ] Header/footer hidden in fullscreen

---

## Translations

Add to `src/messages/en.json`:
```json
{
  "editor": {
    "fullscreen": {
      "enter": "Enter fullscreen",
      "exit": "Exit fullscreen",
      "hint": "Press Escape or F11 to exit"
    }
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] Fullscreen toggle button works
- [ ] Header/footer hidden in fullscreen
- [ ] Editor takes full screen
- [ ] Exit button visible on hover
- [ ] F11 keyboard shortcut works
- [ ] Escape key exits fullscreen
- [ ] Works on all screen sizes
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Translations added (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Implementation Notes

1. **Z-Index:** Ensure fullscreen is above all other elements
2. **Mobile:** Consider hiding fullscreen on mobile (already full width)
3. **Scroll:** Maintain scroll position when entering/exiting
4. **Monaco:** Ensure Monaco editor resizes correctly
5. **Focus Trap:** Keep focus within fullscreen container

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 2.3 status to ✅ Complete*
