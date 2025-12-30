# Milestone 1.4: Settings Page Review

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Medium

---

## Objective

Review and polish the `/settings` page to ensure all settings work correctly and persist properly.

---

## Current State

**Location:** `src/app/[locale]/settings/`

### Settings Components:
- `src/components/settings/AppearanceSettings.tsx`
- `src/components/settings/EditorSettings.tsx`
- `src/components/settings/ExportSettings.tsx`
- `src/components/settings/ResetSettings.tsx`
- `src/components/settings/SettingRow.tsx`

### Zustand Stores:
- `src/stores/theme-store.ts` - Theme preferences
- `src/stores/settings-store.ts` - Editor & export settings
- `src/stores/editor-store.ts` - Editor content & state

---

## Review Checklist

### 1. Appearance Settings
- [ ] Theme mode toggle (light/dark/system) works
- [ ] System preference detection works
- [ ] Document theme selector persists
- [ ] Code theme selector persists
- [ ] Language selector changes locale
- [ ] RTL layout applies for Arabic

### 2. Editor Settings
- [ ] Font size changes apply to editor
- [ ] Font family changes apply
- [ ] Tab size changes work
- [ ] Word wrap toggle works
- [ ] Line numbers toggle works
- [ ] Minimap toggle works
- [ ] Auto-save toggle works
- [ ] Auto-save interval works

### 3. Export Settings
- [ ] Default page size persists
- [ ] Default orientation persists
- [ ] Default margins persist
- [ ] Settings apply to new conversions

### 4. Reset Settings
- [ ] Reset confirmation dialog appears
- [ ] Reset clears all settings
- [ ] Default values restored correctly

---

## Issues to Check

### Persistence
Verify settings persist across:
- Page refresh
- Browser close/open
- Different routes

### Sync Between Components
Verify settings apply to:
- Monaco editor in main page
- PDF generation options
- Preview rendering

### Edge Cases
- Invalid stored values handling
- Migration from old settings format
- First-time user defaults

---

## Testing

### Manual Tests:
1. Change each setting and verify it applies
2. Refresh page and verify persistence
3. Reset settings and verify defaults

### Unit Tests to Add:
```typescript
// Test file: __tests__/unit/components/settings/AppearanceSettings.test.tsx
- Theme mode changes
- Document theme selection
- Language switching

// Test file: __tests__/unit/components/settings/EditorSettings.test.tsx
- Font size changes
- Toggle behaviors
- Auto-save interval

// Test file: __tests__/unit/components/settings/ResetSettings.test.tsx
- Reset confirmation
- Reset functionality
```

---

## Files to Review/Modify

1. `src/app/[locale]/settings/page.tsx`
2. `src/components/settings/AppearanceSettings.tsx`
3. `src/components/settings/EditorSettings.tsx`
4. `src/components/settings/ExportSettings.tsx`
5. `src/components/settings/ResetSettings.tsx`
6. `src/stores/settings-store.ts`
7. `src/stores/theme-store.ts`

---

## Acceptance Criteria

- [ ] All settings toggles work correctly
- [ ] Settings persist in localStorage
- [ ] Settings apply to relevant components
- [ ] Reset clears all settings properly
- [ ] No console errors
- [ ] Accessibility (keyboard navigation)
- [ ] RTL support for Arabic

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 1.4 status to ✅
2. Update progress bar
3. Add to completion log
