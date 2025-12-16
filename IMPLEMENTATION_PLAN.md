# Implementation Plan: Incomplete Features

**Created:** December 16, 2025
**Status:** In Progress

---

## Overview

This document outlines the implementation plan for completing the partial/incomplete features in the Markdown-to-PDF project.

---

## Feature 1: Toolbar Actions (Cursor Insertion)

### Current State
- Toolbar buttons exist but append text to end instead of inserting at cursor position
- File: `src/components/editor/EditorToolbar.tsx`

### Implementation Plan

1. **Get Monaco Editor Reference**
   - Expose editor instance from `MarkdownEditor.tsx` via ref or context
   - Create `EditorContext` to share editor instance

2. **Update Toolbar Functions**
   - Use Monaco's `executeEdits` API to insert at cursor
   - Use `getSelection()` to wrap selected text

3. **Code Changes**
   ```typescript
   // Create context for editor instance
   // src/contexts/editor-context.tsx

   // Update MarkdownEditor to expose instance
   // Update EditorToolbar to use context
   ```

### Testing
- Unit test: Verify text insertion at cursor position
- Unit test: Verify text wrapping around selection
- E2E test: Click toolbar button, verify insertion

---

## Feature 2: Auto-save Implementation

### Current State
- Settings exist: `autoSave: boolean`, `autoSaveInterval: number`
- Not implemented in editor component

### Implementation Plan

1. **Add useEffect in MarkdownEditor**
   - Watch for content changes
   - Debounce and save to localStorage
   - Show save indicator

2. **Add Save Status Indicator**
   - Show "Saving..." during save
   - Show "Saved" after successful save
   - Show timestamp of last save

3. **Code Changes**
   ```typescript
   // In MarkdownEditor.tsx
   useEffect(() => {
     if (!editorSettings.autoSave) return;
     const interval = setInterval(() => {
       // Save logic
     }, editorSettings.autoSaveInterval * 1000);
     return () => clearInterval(interval);
   }, [content, editorSettings]);
   ```

### Testing
- Unit test: Verify auto-save triggers at interval
- Unit test: Verify auto-save respects enabled setting

---

## Feature 3: Table of Contents Display

### Current State
- `TableOfContents.tsx` component exists
- TOC data extracted in `parseMarkdownFull()`
- Not rendered in UI

### Implementation Plan

1. **Add TOC Toggle Button**
   - Add button in preview panel header
   - Toggle TOC sidebar visibility

2. **Render TOC Sidebar**
   - Show collapsible sidebar in preview
   - Clickable links that scroll to headings

3. **Store TOC State**
   - Add `showToc` to editor store

### Testing
- Unit test: TOC extraction from markdown
- E2E test: Toggle TOC, click heading, verify scroll

---

## Feature 4: Keyboard Shortcuts

### Current State
- Translations exist for shortcuts
- Monaco editor has built-in shortcuts
- Custom shortcuts not bound

### Implementation Plan

1. **Define Shortcut Map**
   ```typescript
   const shortcuts = {
     'Ctrl+B': 'bold',
     'Ctrl+I': 'italic',
     'Ctrl+K': 'link',
     'Ctrl+Shift+K': 'codeBlock',
     'Ctrl+S': 'save',
     'Ctrl+P': 'preview',
   };
   ```

2. **Register Monaco Key Bindings**
   - Use `editor.addCommand()` or `editor.addAction()`

3. **Add Global Shortcuts**
   - Use `useEffect` with `keydown` listener for non-editor shortcuts

### Testing
- E2E test: Press Ctrl+B, verify bold inserted
- E2E test: Press Ctrl+S, verify download triggered

---

## Feature 5: Rate Limiting

### Current State
- API docs mention 60 req/min
- No middleware implementation

### Implementation Plan

1. **Create Rate Limit Middleware**
   - Use in-memory store (Map with IP → timestamps)
   - For production: Redis-based rate limiting

2. **Apply to API Routes**
   - Wrap handlers with rate limit check
   - Return 429 on limit exceeded

3. **Code Structure**
   ```typescript
   // src/lib/rate-limit.ts
   export function rateLimit(ip: string, limit: number, window: number): boolean

   // In API routes
   import { rateLimit } from '@/lib/rate-limit';
   ```

### Testing
- Integration test: Send 61 requests, verify 429 on 61st
- Unit test: Rate limit function logic

---

## Feature 6: Settings Page

### Current State
- Translations exist in `settings` namespace
- Route not created
- `useSettingsStore` has all necessary state

### Implementation Plan

1. **Create Settings Page**
   - Path: `src/app/[locale]/settings/page.tsx`
   - Sections: Appearance, Editor, Defaults

2. **UI Components**
   - Theme selector (light/dark/system)
   - Language selector
   - Editor settings (fontSize, tabSize, etc.)
   - Default export settings
   - Reset to defaults button

3. **Navigation**
   - Add Settings link to nav (already in translations)

### Testing
- E2E test: Navigate to settings, change theme, verify persistence
- E2E test: Reset to defaults, verify values reset

---

## Feature 7: Custom Font Upload (Future)

### Complexity: High
### Dependencies: File storage solution

### Implementation Notes
- Requires backend storage (S3, local, etc.)
- Font validation needed
- CSS @font-face generation
- **Recommendation:** Defer to future release

---

## Feature 8: Image Upload (Future)

### Complexity: Medium
### Dependencies: File storage solution

### Implementation Notes
- Could use base64 encoding for small images
- For larger: need storage solution
- **Recommendation:** Implement base64 for MVP, storage later

---

## Implementation Order

1. **Phase 1 (Completed)**
   - [x] Analysis complete
   - [x] Feature 5: Rate Limiting (Security priority)
   - [x] Feature 6: Settings Page (Complete existing UI)
   - [x] Security Fixes (SEC-001 to SEC-008)
   - [ ] Feature 2: Auto-save (User experience)
   - [ ] Feature 3: Table of Contents (Feature completion)

2. **Phase 2 (Next Sprint)**
   - [ ] Feature 1: Toolbar Actions (Complex refactor)
   - [ ] Feature 4: Keyboard Shortcuts (Enhancement)

3. **Phase 3 (Future)**
   - [ ] Feature 8: Image Upload (Base64 MVP)
   - [ ] Feature 7: Custom Font Upload (Full storage)

---

## Testing Strategy

Each feature requires:
1. Unit tests for new utility functions
2. Integration tests for API changes
3. E2E tests for UI features
4. Translation updates verification

---

## Definition of Done

- [ ] Feature implemented
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Translations updated (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Manual testing complete
- [ ] Code committed

---

*Plan will be updated as implementation progresses*
