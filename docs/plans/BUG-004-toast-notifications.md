# BUG-004: Add Error Notification System (Toast)

## Overview
Implement a global toast notification system for displaying success, error, and informational messages throughout the application.

## Current State
- No toast/notification system exists
- Error handling is mostly console.log based
- Users don't get visual feedback on operations

## Implementation Plan

### Step 1: Install Toast Library
- Install `sonner` (lightweight, modern toast library)
- `sonner` is preferred over `react-hot-toast` for:
  - Better TypeScript support
  - Smaller bundle size
  - Better styling with Tailwind
  - Built-in themes (light/dark)

### Step 2: Add Toast Provider
- Create `src/components/ui/sonner.tsx` - Toaster component wrapper
- Add Toaster to root layout `src/app/[locale]/layout.tsx`
- Configure theme integration with existing theme system

### Step 3: Update Components with Toast Notifications
Key areas to add notifications:
1. **ConvertButton.tsx** - Success/error on PDF conversion
2. **FileUpload.tsx** - File upload success/error
3. **API error handlers** - Network/API errors
4. **Auto-save (useAutoSave.ts)** - Save status (optional, already has visual indicator)

### Step 4: Create Toast Utility (Optional)
- Create `src/lib/toast.ts` for common toast patterns
- Standardize error messages

## File Changes

### New Files
- `src/components/ui/sonner.tsx` - Toast component

### Modified Files
- `src/app/[locale]/layout.tsx` - Add Toaster provider
- `src/components/converter/ConvertButton.tsx` - Add success/error toasts
- `src/components/editor/FileUpload.tsx` - Add upload feedback

## Testing Plan
- Unit test: Toast renders correctly
- Integration test: Toast appears on conversion error
- E2E test: Visual feedback on user actions

## Usage After Implementation

```typescript
import { toast } from 'sonner';

// Success
toast.success('PDF generated successfully');

// Error
toast.error('Failed to convert document');

// Loading
toast.loading('Converting...');

// Promise-based
toast.promise(convertToPdf(), {
  loading: 'Converting...',
  success: 'PDF generated!',
  error: 'Conversion failed',
});
```
