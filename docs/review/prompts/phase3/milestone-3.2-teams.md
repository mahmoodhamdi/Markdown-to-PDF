# Milestone 3.2: Team Management Polish

## Status: ✅ Complete
## Priority: MEDIUM
## Estimated Scope: Medium
## Completed: 2025-12-30

---

## Objective

Polish team management features for a seamless collaboration experience.

---

## Current Components

- `src/app/[locale]/dashboard/teams/page.tsx`
- `src/app/[locale]/dashboard/teams/[teamId]/page.tsx`
- `src/components/teams/TeamList.tsx`
- `src/components/teams/TeamMembers.tsx`
- `src/components/teams/AddMemberDialog.tsx`
- `src/components/teams/CreateTeamDialog.tsx`
- `src/components/teams/TeamSettings.tsx`
- `src/components/teams/ActivityLog.tsx`

---

## Enhancement Areas

### 1. Team List Improvements

**Add:**
- Member avatars preview (first 3-5)
- Quick actions (settings, leave)
- Team plan badge
- Last activity indicator

```typescript
// Enhanced TeamCard
<Card>
  <div className="flex justify-between">
    <div>
      <h3>{team.name}</h3>
      <Badge>{team.plan}</Badge>
    </div>
    <AvatarGroup members={team.members.slice(0, 5)} />
  </div>
  <div className="text-sm text-muted-foreground">
    {team.members.length} members · Last active {formatRelative(team.lastActivity)}
  </div>
</Card>
```

### 2. Member Management Polish

**Add:**
- Bulk member actions
- Member search/filter
- Pending invitations section
- Role change confirmation
- Member activity view

**Improve:**
- Better role selection UI
- Clearer permission explanations

### 3. Invitation Flow

**Current Issues:**
- Invitation emails may not explain features
- Accept/decline pages may be basic

**Improve:**
- Rich invitation email template
- Beautiful accept/decline page
- Show team preview before accepting

### 4. Team Settings Enhancement

**Add:**
- Team avatar/logo upload
- Team description field
- Notification preferences
- Danger zone (transfer ownership, delete)
- Audit log access

### 5. Activity Log Improvements

**Add:**
- Activity filtering by type/user
- Activity export
- Activity pagination
- Rich activity details

---

## New Components

### 1. AvatarGroup

```typescript
// src/components/ui/avatar-group.tsx
interface AvatarGroupProps {
  members: Array<{ name?: string; image?: string }>;
  max?: number;
}

export function AvatarGroup({ members, max = 5 }: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((member, i) => (
        <Avatar key={i} className="border-2 border-background">
          <AvatarImage src={member.image} />
          <AvatarFallback>{member.name?.[0]}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs">
          +{remaining}
        </div>
      )}
    </div>
  );
}
```

### 2. TransferOwnershipDialog

```typescript
// src/components/teams/TransferOwnershipDialog.tsx
// Allows owner to transfer ownership to an admin
// Requires confirmation
// Sends notification to new owner
```

### 3. PendingInvitations

```typescript
// src/components/teams/PendingInvitations.tsx
// Shows all pending invitations
// Allows resend/cancel
// Shows expiration status
```

---

## API Improvements

### Add endpoints if missing:

```typescript
// GET /api/teams/[teamId]/activity?page=1&limit=20&type=member_added
// POST /api/teams/[teamId]/transfer-ownership
// GET /api/teams/[teamId]/invitations
// DELETE /api/teams/[teamId]/invitations/[invitationId]
```

---

## Invitation Email Improvement

Update template:
```typescript
// src/lib/email/templates/team-invitation.ts
- Team name and logo
- Inviter name and message
- Team member count
- Clear CTA button
- Expiration notice
- Decline option
```

---

## Files to Create/Modify

### Create:
1. `src/components/ui/avatar-group.tsx`
2. `src/components/teams/TransferOwnershipDialog.tsx`
3. `src/components/teams/PendingInvitations.tsx`
4. `src/components/teams/TeamAvatar.tsx`

### Modify:
1. `src/components/teams/TeamList.tsx`
2. `src/components/teams/TeamMembers.tsx`
3. `src/components/teams/TeamSettings.tsx`
4. `src/components/teams/ActivityLog.tsx`
5. `src/lib/email/templates/team-invitation.ts`

---

## Testing

1. Team creation flow
2. Member invitation flow
3. Role changes
4. Team settings updates
5. Ownership transfer
6. Invitation email sent

---

## Acceptance Criteria

- [ ] Avatar groups show member previews
- [ ] Pending invitations visible
- [ ] Role changes have confirmation
- [ ] Activity log filterable
- [ ] Ownership transfer works
- [ ] Invitation emails improved
- [ ] Mobile responsive
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 3.2 status to ✅
2. Update progress bar
3. Add to completion log
