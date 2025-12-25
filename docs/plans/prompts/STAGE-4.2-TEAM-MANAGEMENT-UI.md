# Stage 4.2: Team Management UI

**Phase:** 4 - Team Features
**Priority:** 🟡 Medium
**Estimated Effort:** Large

---

## Context

Individual team management page for owners/admins to manage members and settings.

---

## Task Requirements

### 1. Create Team Detail Page

**File to create:** `src/app/[locale]/dashboard/teams/[teamId]/page.tsx`

### 2. Create Team Components

**Files to create:**
- `src/components/teams/TeamMembers.tsx` - Member list with roles
- `src/components/teams/AddMemberDialog.tsx` - Add member modal
- `src/components/teams/ChangeMemberRole.tsx` - Role dropdown
- `src/components/teams/TeamSettings.tsx` - Team settings

### 3. Member Management

Actions:
- View all members with roles
- Add member (by email)
- Remove member
- Change member role (admin only)
- Transfer ownership (owner only)

### 4. Use Existing APIs

**Existing endpoints:**
- `GET /api/teams/[teamId]` - Team details
- `POST /api/teams/[teamId]/members` - Add member
- `DELETE /api/teams/[teamId]/members/[memberId]` - Remove member
- `PATCH /api/teams/[teamId]/members/[memberId]` - Update role

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ My Company                                   [Team Settings] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Members (5/10)                               [+ Add Member]  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ John Doe          john@example.com      Owner     [···] │  │
│ │ Jane Smith        jane@example.com      Admin     [···] │  │
│ │ Bob Johnson       bob@example.com       Member    [···] │  │
│ │ Alice Brown       alice@example.com     Member    [···] │  │
│ │ Charlie Wilson    charlie@example.com   Member    [···] │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Pending Invitations (2)                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ david@example.com     Invited Dec 20    [Resend] [Cancel]│  │
│ │ eve@example.com       Invited Dec 22    [Resend] [Cancel]│  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Roles & Permissions

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View members | ✓ | ✓ | ✓ |
| Add member | ✓ | ✓ | ✗ |
| Remove member | ✓ | ✓ | ✗ |
| Change roles | ✓ | ✗ | ✗ |
| Delete team | ✓ | ✗ | ✗ |
| Team settings | ✓ | ✓ | ✗ |

---

## Testing Requirements

- [ ] Team page loads with members
- [ ] Add member works
- [ ] Remove member works
- [ ] Role change works
- [ ] Permission checks enforced

---

## Definition of Done

- [ ] Team detail page created
- [ ] Member list displays
- [ ] Add/remove member works
- [ ] Role management works
- [ ] Permissions enforced
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 4.2 status to ✅ Complete*
