# Feature Completion Plan: FEAT-003 to FEAT-005

## Overview
Implementation plan for the remaining feature completion items.

---

## FEAT-003: Add Fullscreen Mode UI

### Current State
- `editor-store.ts` has `isFullscreen` state and `toggleFullscreen` action
- No UI implementation for fullscreen mode

### Implementation Plan
1. Update `src/app/[locale]/page.tsx` to apply fullscreen styles
2. Add fullscreen toggle button to `EditorToolbar.tsx` (if not present)
3. Add exit fullscreen button/overlay when in fullscreen mode
4. Apply proper CSS for fullscreen (hide header/footer, maximize editor)

### Files to Modify
- `src/app/[locale]/page.tsx` - Apply fullscreen CSS classes
- `src/components/editor/EditorToolbar.tsx` - Ensure fullscreen button exists

---

## FEAT-004: Add Print Functionality

### Current State
- No print functionality exists
- ConvertButton only handles PDF/HTML download

### Implementation Plan
1. Add print button to ConvertButton or as separate component
2. Use `window.print()` with print-specific styles
3. Apply print CSS for clean output
4. Show preview panel content formatted for printing

### Files to Modify
- `src/components/converter/ConvertButton.tsx` - Add print option
- `src/app/globals.css` - Add print media styles

---

## FEAT-005: Add Undo/Redo Toolbar Buttons

### Current State
- Monaco editor has built-in undo/redo
- No toolbar buttons for undo/redo
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y) likely work through Monaco

### Implementation Plan
1. Add Undo and Redo buttons to `EditorToolbar.tsx`
2. Use Monaco editor's `trigger('keyboard', 'undo')` and `trigger('keyboard', 'redo')`
3. Add appropriate icons (Undo2, Redo2 from lucide-react)

### Files to Modify
- `src/components/editor/EditorToolbar.tsx` - Add undo/redo buttons

---

## Testing Plan
- Unit tests for new toolbar buttons
- Integration tests for print functionality
- E2E tests for fullscreen mode

## Translation Updates
- Check if translations already exist for undo/redo
- Add print-related translations if needed
