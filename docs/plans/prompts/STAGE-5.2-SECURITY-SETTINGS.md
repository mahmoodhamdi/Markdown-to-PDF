# Stage 5.2: Security Settings

**Phase:** 5 - Account Management
**Priority:** 🟡 Medium
**Estimated Effort:** Medium

---

## Context

Users need security settings to manage passwords, sessions, and connected accounts.

---

## Task Requirements

### 1. Create Security Page

**File to create:** `src/app/[locale]/dashboard/security/page.tsx`

### 2. Create Security Components

**Files to create:**
- `src/components/security/PasswordChange.tsx` - Change password form
- `src/components/security/SessionList.tsx` - Active sessions
- `src/components/security/ConnectedAccounts.tsx` - OAuth connections

### 3. Session Management API

**File to create:** `src/app/api/users/sessions/route.ts`

- GET: List active sessions
- DELETE: Revoke session

### 4. Connected Accounts

Show OAuth connections:
- GitHub (connect/disconnect)
- Google (connect/disconnect)

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Security                                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Password ───────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Current Password  [••••••••••••      ]                    │ │
│ │ New Password      [                  ]                    │ │
│ │ Confirm Password  [                  ]                    │ │
│ │                                                           │ │
│ │                              [Change Password]            │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Active Sessions ────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Chrome on Windows          This device      [Current]     │ │
│ │ Firefox on MacOS           2 days ago       [Revoke]      │ │
│ │ Safari on iPhone           5 days ago       [Revoke]      │ │
│ │                                                           │ │
│ │                              [Revoke All Other Sessions]  │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Connected Accounts ─────────────────────────────────────┐ │
│ │                                                           │ │
│ │ GitHub         @johndoe              [Disconnect]         │ │
│ │ Google         Not connected         [Connect]            │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Definition of Done

- [ ] Security page created
- [ ] Password change works
- [ ] Session list displays
- [ ] Session revocation works
- [ ] Connected accounts shown
- [ ] OAuth connect/disconnect works
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 5.2 status to ✅ Complete*
