# Milestone 1.1: Dashboard Files Page Implementation

## Status: ⬜ Not Started
## Priority: HIGH
## Estimated Scope: Medium

---

## Objective

Implement the missing `/dashboard/files` page that is referenced in the DashboardSidebar but does not exist. This page should allow users to manage their uploaded files stored in Firebase/Cloudinary.

---

## Current State

### What Exists:
- DashboardSidebar references `/dashboard/files` (line 31 with FolderOpen icon)
- Storage API routes are fully implemented:
  - `GET /api/storage/files` - List user files
  - `GET /api/storage/files/[fileId]` - Get file details
  - `DELETE /api/storage/files/[fileId]` - Delete file
  - `GET /api/storage/files/[fileId]/download` - Download file
  - `POST /api/storage/upload` - Upload file
  - `GET /api/storage/quota` - Get storage quota
- Storage service in `src/lib/storage/service.ts`
- UserFile model in `src/lib/db/models/UserFile.ts`

### What's Missing:
- `src/app/[locale]/dashboard/files/page.tsx` - The actual page
- File list component
- File upload UI in dashboard context
- File actions (download, delete, rename)
- Storage quota visualization

---

## Implementation Requirements

### 1. Create the Files Page
**File:** `src/app/[locale]/dashboard/files/page.tsx`

```typescript
// Required features:
- useSession() for authentication
- Fetch files from /api/storage/files
- Display storage quota from /api/storage/quota
- File upload functionality
- File list with actions
- Empty state for no files
- Loading skeleton
- Error handling
```

### 2. Create FileList Component
**File:** `src/components/dashboard/FileList.tsx`

Features:
- Table/grid view toggle
- File name, size, type, upload date
- Actions: Download, Delete, Copy link
- Bulk selection and delete
- Sorting (name, date, size)
- File type icons

### 3. Create FileUploadZone Component
**File:** `src/components/dashboard/FileUploadZone.tsx`

Features:
- Drag and drop zone
- Click to upload
- Progress indicator
- File type validation
- Size limit based on plan
- Multiple file upload

### 4. Create StorageQuotaCard Component
**File:** `src/components/dashboard/StorageQuotaCard.tsx`

Features:
- Visual progress bar
- Used / Total display
- Upgrade CTA when near limit
- Plan-based limits display

---

## API Integration

### Endpoints to Use:

```typescript
// List files
GET /api/storage/files
Response: { files: UserFile[], total: number }

// Get quota
GET /api/storage/quota
Response: { used: number, limit: number, remaining: number, percentage: number }

// Upload file
POST /api/storage/upload
Body: FormData with file
Response: { file: UserFile }

// Delete file
DELETE /api/storage/files/[fileId]
Response: { success: true }

// Download file
GET /api/storage/files/[fileId]/download
Response: File stream or signed URL
```

---

## UI/UX Requirements

### Layout:
```
┌─────────────────────────────────────────────────┐
│ Files                              [Upload btn] │
├─────────────────────────────────────────────────┤
│ Storage: ████████░░ 800MB / 1GB    [Upgrade]    │
├─────────────────────────────────────────────────┤
│ [Grid] [List]  Search: [________]  Sort: [▼]    │
├─────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ 📄   │ │ 📄   │ │ 📄   │ │ 📄   │            │
│ │doc.md│ │img.png│ │file.pdf│ │...  │           │
│ │ 2.3KB│ │ 1.2MB│ │ 500KB│ │      │            │
│ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                 │
│ Showing 4 of 12 files                          │
└─────────────────────────────────────────────────┘
```

### Empty State:
- Icon: FolderOpen or CloudUpload
- Title: "No files yet"
- Description: "Upload your first file to get started"
- CTA: Upload button

### Loading State:
- Skeleton cards/rows
- Quota skeleton

---

## Translations Required

Add to `src/messages/en.json`:
```json
{
  "dashboard": {
    "files": {
      "title": "Files",
      "upload": "Upload",
      "uploadFiles": "Upload Files",
      "dragDrop": "Drag and drop files here, or click to browse",
      "storage": "Storage",
      "used": "Used",
      "of": "of",
      "upgrade": "Upgrade for more storage",
      "noFiles": "No files yet",
      "noFilesDescription": "Upload your first file to get started",
      "fileName": "File Name",
      "size": "Size",
      "type": "Type",
      "uploadedAt": "Uploaded",
      "actions": "Actions",
      "download": "Download",
      "delete": "Delete",
      "copyLink": "Copy Link",
      "deleteConfirm": "Are you sure you want to delete this file?",
      "deleteSuccess": "File deleted successfully",
      "uploadSuccess": "File uploaded successfully",
      "uploadError": "Failed to upload file",
      "fileTooLarge": "File exceeds maximum size",
      "quotaExceeded": "Storage quota exceeded"
    }
  }
}
```

Add Arabic translations to `src/messages/ar.json`

---

## Plan-Based Limits

From `src/lib/plans/config.ts`:
- Free: No cloud storage
- Pro: 1GB storage
- Team: 10GB storage
- Enterprise: Unlimited

Handle free plan users:
- Show upgrade prompt instead of upload
- Explain storage is a premium feature

---

## Testing Requirements

### Unit Tests:
- FileList component rendering
- FileUploadZone drag/drop handling
- StorageQuotaCard percentage calculation
- Empty states
- Loading states

### Integration Tests:
- File upload API integration
- File delete API integration
- Quota update after upload/delete

### E2E Tests:
- Full upload flow
- Delete file flow
- Quota display accuracy

---

## Files to Create/Modify

### Create:
1. `src/app/[locale]/dashboard/files/page.tsx`
2. `src/components/dashboard/FileList.tsx`
3. `src/components/dashboard/FileUploadZone.tsx`
4. `src/components/dashboard/StorageQuotaCard.tsx`
5. `__tests__/unit/components/dashboard/FileList.test.tsx`
6. `__tests__/unit/components/dashboard/FileUploadZone.test.tsx`
7. `__tests__/unit/components/dashboard/StorageQuotaCard.test.tsx`

### Modify:
1. `src/messages/en.json` - Add translations
2. `src/messages/ar.json` - Add Arabic translations

---

## Acceptance Criteria

- [ ] Files page accessible at /dashboard/files
- [ ] File list displays with all metadata
- [ ] File upload works with drag-drop and click
- [ ] Delete file with confirmation
- [ ] Download file works
- [ ] Storage quota displayed accurately
- [ ] Empty state shown when no files
- [ ] Loading skeleton during data fetch
- [ ] Error handling for all operations
- [ ] Translations complete (en + ar)
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Free plan shows upgrade prompt
- [ ] Responsive design (mobile/tablet/desktop)

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:

1. Change milestone status from ⬜ to ✅
2. Update Phase 1 progress bar
3. Add completion date to log
4. Update total percentage

---

## Notes

- Use existing UI components from `src/components/ui/`
- Follow existing dashboard page patterns
- Use Zustand if local state management needed
- Use sonner for toast notifications
- Follow RTL-friendly CSS (me-/ms- prefixes)
