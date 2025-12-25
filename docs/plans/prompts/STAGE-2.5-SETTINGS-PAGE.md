# Stage 2.5: Settings Page

**Phase:** 2 - UI/UX Completion
**Priority:** 🟠 High
**Estimated Effort:** Medium

---

## Context

Settings translations exist but no settings page is implemented:
- Translations in `settings` namespace
- `useSettingsStore` has all necessary state
- Settings link in navigation points to non-existent page

### Current State

- Settings store: `src/stores/settings-store.ts` is complete
- Translations exist for settings UI
- Route `/[locale]/settings` doesn't exist

---

## Task Requirements

### 1. Create Settings Page

**File to create:** `src/app/[locale]/settings/page.tsx`

```tsx
export default function SettingsPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="space-y-8">
        <AppearanceSettings />
        <EditorSettings />
        <ExportSettings />
        <ResetSettings />
      </div>
    </div>
  );
}
```

### 2. Create Appearance Settings Section

**File to create:** `src/components/settings/AppearanceSettings.tsx`

```tsx
// Theme mode (light/dark/system)
// Document theme default
// Code theme default
// Language preference
```

Settings:
- **Theme Mode:** Light / Dark / System
- **Default Document Theme:** Dropdown with all themes
- **Default Code Theme:** Dropdown with code themes
- **Language:** English / Arabic

### 3. Create Editor Settings Section

**File to create:** `src/components/settings/EditorSettings.tsx`

Settings:
- **Font Size:** Slider (12-24)
- **Tab Size:** 2 / 4 / 8
- **Line Numbers:** On / Off
- **Word Wrap:** On / Off
- **Auto-save:** On / Off
- **Auto-save Interval:** Slider (10-120 seconds)
- **Minimap:** On / Off
- **Vim Mode:** On / Off (if implemented)

### 4. Create Export Settings Section

**File to create:** `src/components/settings/ExportSettings.tsx`

Settings:
- **Default Page Size:** A4 / Letter / Legal / etc.
- **Default Orientation:** Portrait / Landscape
- **Default Margins:** Presets (Normal, Narrow, Wide)
- **Include Header:** On / Off (with customization)
- **Include Footer:** On / Off (with customization)
- **Show Watermark:** On / Off (free users)

### 5. Create Reset Settings Section

**File to create:** `src/components/settings/ResetSettings.tsx`

```tsx
<Card>
  <CardHeader>
    <CardTitle>{t('reset.title')}</CardTitle>
    <CardDescription>{t('reset.description')}</CardDescription>
  </CardHeader>
  <CardContent>
    <Button variant="destructive" onClick={handleReset}>
      {t('reset.button')}
    </Button>
  </CardContent>
</Card>
```

### 6. Add Navigation Link

**File to modify:** `src/components/layout/Header.tsx`

Ensure settings link exists in navigation/dropdown menu.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/[locale]/settings/page.tsx` | Create |
| `src/components/settings/AppearanceSettings.tsx` | Create |
| `src/components/settings/EditorSettings.tsx` | Create |
| `src/components/settings/ExportSettings.tsx` | Create |
| `src/components/settings/ResetSettings.tsx` | Create |
| `src/components/settings/index.ts` | Create exports |
| `src/components/layout/Header.tsx` | Modify if needed |

---

## Visual Design

### Settings Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Settings                                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Appearance ─────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Theme Mode        [Light ▼]                               │ │
│ │ Document Theme    [GitHub ▼]                              │ │
│ │ Code Theme        [One Dark ▼]                            │ │
│ │ Language          [English ▼]                             │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Editor ─────────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Font Size         [────●────] 14                          │ │
│ │ Tab Size          ○ 2  ● 4  ○ 8                           │ │
│ │ Line Numbers      [●]                                     │ │
│ │ Word Wrap         [●]                                     │ │
│ │ Auto-save         [●]                                     │ │
│ │ Auto-save Interval [────●────] 30s                        │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Export Defaults ────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Page Size         [A4 ▼]                                  │ │
│ │ Orientation       ● Portrait  ○ Landscape                 │ │
│ │ Margins           [Normal ▼]                              │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Reset ──────────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Reset all settings to their default values.               │ │
│ │                                                           │ │
│ │ [Reset to Defaults]                                       │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### SettingRow Component

```tsx
interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <Label className="text-base">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests

**File to create:** `__tests__/unit/components/settings/*.test.tsx`

Test cases:
- [ ] AppearanceSettings renders correctly
- [ ] Theme mode change updates store
- [ ] EditorSettings renders all options
- [ ] Font size slider updates store
- [ ] Reset button resets all settings

### E2E Tests

**File to create:** `__tests__/e2e/settings.spec.ts`

Test cases:
- [ ] Navigate to settings page
- [ ] Change theme mode, verify applied
- [ ] Change font size, verify in editor
- [ ] Reset settings, verify defaults restored
- [ ] Settings persist after page reload

---

## Translations

Verify in `src/messages/en.json`:
```json
{
  "settings": {
    "title": "Settings",
    "appearance": {
      "title": "Appearance",
      "themeMode": "Theme Mode",
      "light": "Light",
      "dark": "Dark",
      "system": "System",
      "documentTheme": "Document Theme",
      "codeTheme": "Code Theme",
      "language": "Language"
    },
    "editor": {
      "title": "Editor",
      "fontSize": "Font Size",
      "tabSize": "Tab Size",
      "lineNumbers": "Line Numbers",
      "wordWrap": "Word Wrap",
      "autoSave": "Auto-save",
      "autoSaveInterval": "Auto-save Interval"
    },
    "export": {
      "title": "Export Defaults",
      "pageSize": "Page Size",
      "orientation": "Orientation",
      "portrait": "Portrait",
      "landscape": "Landscape",
      "margins": "Margins"
    },
    "reset": {
      "title": "Reset Settings",
      "description": "Reset all settings to their default values.",
      "button": "Reset to Defaults",
      "confirm": "Are you sure? This cannot be undone."
    }
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] Settings page created at /[locale]/settings
- [ ] Appearance settings section works
- [ ] Editor settings section works
- [ ] Export settings section works
- [ ] Reset settings works with confirmation
- [ ] All settings persist to store
- [ ] Settings applied immediately (real-time)
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Translations added (EN & AR)
- [ ] Responsive design works
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Implementation Notes

1. **Real-time Updates:** Settings should apply immediately
2. **Validation:** Validate input ranges (font size, interval)
3. **Accessibility:** Proper labels and ARIA attributes
4. **Mobile:** Responsive layout for all screen sizes
5. **Persistence:** All settings saved to localStorage via Zustand

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 2.5 status to ✅ Complete*
