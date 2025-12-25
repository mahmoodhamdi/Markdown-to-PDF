# Stage 5.1: Profile Page

**Phase:** 5 - Account Management
**Priority:** 🟡 Medium
**Estimated Effort:** Medium

---

## Context

Users need a profile page to view and update their personal information.

**Prerequisite:** Stage 1.3 (User Profile API) must be completed first.

---

## Task Requirements

### 1. Create Profile Page

**File to create:** `src/app/[locale]/dashboard/profile/page.tsx`

### 2. Create Profile Components

**Files to create:**
- `src/components/profile/ProfileHeader.tsx` - Avatar and name
- `src/components/profile/ProfileForm.tsx` - Edit profile form
- `src/components/profile/AvatarUpload.tsx` - Upload profile picture

### 3. Profile Information

Editable fields:
- Profile picture (upload)
- Display name
- Email (with verification)
- Bio (optional)

Read-only fields:
- Account created date
- Current plan
- Last login

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Profile                                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         ┌─────┐                                              │
│         │     │  John Doe                                    │
│         │  👤 │  john@example.com                            │
│         └─────┘  Pro Plan • Member since Dec 2024            │
│         [Change Photo]                                       │
│                                                              │
│ ┌─ Personal Information ───────────────────────────────────┐ │
│ │                                                           │ │
│ │ Display Name    [John Doe                    ]            │ │
│ │                                                           │ │
│ │ Email           [john@example.com            ] [Change]   │ │
│ │                 ✓ Verified                                │ │
│ │                                                           │ │
│ │ Bio             [Software developer...       ]            │ │
│ │                                                           │ │
│ │                                     [Save Changes]        │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Avatar Upload

Use existing storage service for avatar upload:
- Max size: 2MB
- Formats: JPG, PNG, GIF
- Auto-resize to 256x256

---

## Definition of Done

- [ ] Profile page created
- [ ] Profile form works
- [ ] Avatar upload works
- [ ] Name update saves
- [ ] Email change triggers verification
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 5.1 status to ✅ Complete*
