# Stage 5.4: Account Actions

**Phase:** 5 - Account Management
**Priority:** 🟡 Medium
**Estimated Effort:** Medium

---

## Context

Users need the ability to delete their account and export their data (GDPR compliance).

---

## Task Requirements

### 1. Create Account Page

**File to create:** `src/app/[locale]/dashboard/account/page.tsx`

### 2. Create Account Components

**Files to create:**
- `src/components/account/DataExport.tsx` - Export user data
- `src/components/account/DeleteAccount.tsx` - Delete account flow

### 3. Data Export API

**File to create:** `src/app/api/users/export/route.ts`

Export includes:
- Profile information
- Conversion history
- Stored files list
- Team memberships
- Analytics data

Format: ZIP file with JSON + files

### 4. Account Deletion API

Uses existing: `DELETE /api/users/profile`

Deletion process:
1. Cancel subscriptions
2. Remove from teams
3. Delete stored files
4. Delete user data
5. Send confirmation email

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Account                                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Export Data ────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Download a copy of all your data.                        │ │
│ │                                                           │ │
│ │ Includes: Profile, files, conversion history, analytics  │ │
│ │                                                           │ │
│ │                              [Export My Data]             │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Delete Account ─────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ ⚠️ This action cannot be undone.                          │ │
│ │                                                           │ │
│ │ Deleting your account will:                              │ │
│ │ • Cancel any active subscriptions                        │ │
│ │ • Remove you from all teams                              │ │
│ │ • Delete all your stored files                           │ │
│ │ • Permanently delete your data                           │ │
│ │                                                           │ │
│ │                              [Delete Account]             │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Delete Confirmation Dialog

```
┌─────────────────────────────────────────────────┐
│ Delete Account                              [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Are you sure you want to delete your account?   │
│                                                 │
│ Type "DELETE" to confirm:                       │
│ [                                   ]           │
│                                                 │
│ Enter your password:                            │
│ [•••••••••••                        ]           │
│                                                 │
│           [Cancel]  [Delete Account]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Definition of Done

- [ ] Account page created
- [ ] Data export works (ZIP download)
- [ ] Delete flow works
- [ ] Confirmation required
- [ ] Subscriptions canceled
- [ ] Files deleted
- [ ] Confirmation email sent
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 5.4 status to ✅ Complete*
