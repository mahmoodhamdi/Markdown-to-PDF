# Stage 2.1: Auto-save Implementation

**Phase:** 2 - UI/UX Completion
**Priority:** 🟠 High
**Estimated Effort:** Small

---

## Context

Auto-save settings exist in the settings store but are not implemented:
- `autoSave: boolean` - Enable/disable auto-save
- `autoSaveInterval: number` - Interval in seconds

Users expect their work to be saved automatically to prevent data loss.

### Current State

- Settings store: `src/stores/settings-store.ts` has auto-save settings
- Editor store: `src/stores/editor-store.ts` has content state
- Hook exists: `src/hooks/useAutoSave.ts` (partially implemented)
- No visual save indicator

---

## Task Requirements

### 1. Complete useAutoSave Hook

**File:** `src/hooks/useAutoSave.ts`

Complete the implementation:

```typescript
export function useAutoSave() {
  const { content } = useEditorStore();
  const { editorSettings } = useSettingsStore();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!editorSettings.autoSave) return;

    const timeoutId = setTimeout(() => {
      setSaveStatus('saving');
      try {
        localStorage.setItem('markdown-content', content);
        localStorage.setItem('markdown-last-saved', new Date().toISOString());
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        setSaveStatus('error');
      }
    }, editorSettings.autoSaveInterval * 1000);

    return () => clearTimeout(timeoutId);
  }, [content, editorSettings.autoSave, editorSettings.autoSaveInterval]);

  return { saveStatus, lastSaved };
}
```

### 2. Add Save Status Indicator

**File to modify:** `src/components/editor/EditorStats.tsx`

Add save status to the editor stats bar:

```tsx
// Show save status
{saveStatus === 'saving' && <span className="text-yellow-500">Saving...</span>}
{saveStatus === 'saved' && <span className="text-green-500">Saved</span>}
{saveStatus === 'error' && <span className="text-red-500">Save failed</span>}

// Show last saved time
{lastSaved && (
  <span className="text-muted-foreground">
    Last saved: {formatRelativeTime(lastSaved)}
  </span>
)}
```

### 3. Add Manual Save Button

**File to modify:** `src/components/editor/EditorToolbar.tsx`

Add a save button that:
- Triggers immediate save
- Shows save status feedback
- Works with Ctrl+S keyboard shortcut

### 4. Load Saved Content on Mount

**File to modify:** `src/app/[locale]/page.tsx` or `src/components/editor/MarkdownEditor.tsx`

On initial load:
```typescript
useEffect(() => {
  const savedContent = localStorage.getItem('markdown-content');
  if (savedContent) {
    setContent(savedContent);
  }
}, []);
```

### 5. Add Recovery Prompt

When user has unsaved content and refreshes:
- Show a toast or dialog asking if they want to recover
- Option to discard or restore

---

## Files to Modify

| File | Action |
|------|--------|
| `src/hooks/useAutoSave.ts` | Complete |
| `src/components/editor/EditorStats.tsx` | Modify |
| `src/components/editor/EditorToolbar.tsx` | Modify |
| `src/app/[locale]/page.tsx` | Modify |
| `src/stores/editor-store.ts` | Add saveStatus |

---

## Visual Design

### Save Status Indicator

```
┌─────────────────────────────────────────────────────────┐
│ Words: 234  │  Characters: 1,456  │  ● Saved (2 min ago)│
└─────────────────────────────────────────────────────────┘
```

States:
- **Idle:** No indicator
- **Saving:** Yellow dot + "Saving..."
- **Saved:** Green dot + "Saved (X ago)"
- **Error:** Red dot + "Save failed"

---

## Testing Requirements

### Unit Tests

**File:** `__tests__/unit/hooks/useAutoSave.test.ts`

Test cases:
- [ ] Does not save when autoSave is disabled
- [ ] Saves after interval when autoSave is enabled
- [ ] Updates saveStatus during save
- [ ] Handles localStorage errors gracefully
- [ ] Debounces rapid content changes

### E2E Tests

**File to add tests:** `__tests__/e2e/editor.spec.ts`

Test cases:
- [ ] Content persists after page reload
- [ ] Save indicator shows correctly
- [ ] Manual save works with button
- [ ] Ctrl+S triggers save

---

## Translations

Add to `src/messages/en.json`:
```json
{
  "editor": {
    "save": {
      "saving": "Saving...",
      "saved": "Saved",
      "savedAgo": "Saved {time} ago",
      "error": "Save failed",
      "manual": "Save",
      "recovery": {
        "title": "Recover unsaved work?",
        "message": "We found unsaved content from your last session.",
        "recover": "Recover",
        "discard": "Discard"
      }
    }
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] Auto-save works based on settings
- [ ] Save status indicator visible
- [ ] Last saved time displayed
- [ ] Manual save button works
- [ ] Ctrl+S keyboard shortcut works
- [ ] Content loads on page mount
- [ ] Recovery prompt for unsaved content
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Translations added (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Implementation Notes

1. **Debouncing:** Use debounce to avoid saving on every keystroke
2. **Storage Quota:** Handle localStorage quota exceeded errors
3. **Multiple Tabs:** Consider conflicts when editing in multiple tabs
4. **Cloud Sync:** Future enhancement - sync with cloud storage for logged-in users

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 2.1 status to ✅ Complete*
