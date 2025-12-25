# Stage 4.3: Team Invitations

**Phase:** 4 - Team Features
**Priority:** 🟡 Medium
**Estimated Effort:** Medium

---

## Context

Team invitation system needs email integration and acceptance flow.

---

## Task Requirements

### 1. Create Invitation Model

**File to create:** `src/lib/db/models/TeamInvitation.ts`

```typescript
interface ITeamInvitation {
  teamId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}
```

### 2. Create Invitation APIs

**Files to create:**
- `src/app/api/teams/[teamId]/invitations/route.ts` - List/create invitations
- `src/app/api/invitations/[token]/route.ts` - Accept/decline invitation
- `src/app/api/invitations/[token]/accept/route.ts` - Accept invitation
- `src/app/api/invitations/[token]/decline/route.ts` - Decline invitation

### 3. Create Invitation Email

**File to create:** `src/lib/email/templates/team-invitation.ts`

### 4. Create Accept/Decline Page

**File to create:** `src/app/[locale]/invitation/[token]/page.tsx`

---

## Invitation Flow

1. Admin clicks "Add Member" with email
2. System creates invitation with token
3. Email sent with accept/decline links
4. User clicks link → taken to invitation page
5. User accepts → added to team
6. User declines → invitation marked declined

---

## Testing Requirements

- [ ] Invitation created successfully
- [ ] Email sent with token
- [ ] Accept adds user to team
- [ ] Decline updates status
- [ ] Expired invitations handled

---

## Definition of Done

- [ ] Invitation model created
- [ ] Invitation APIs work
- [ ] Email sent on invite
- [ ] Accept/decline page works
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 4.3 status to ✅ Complete*
