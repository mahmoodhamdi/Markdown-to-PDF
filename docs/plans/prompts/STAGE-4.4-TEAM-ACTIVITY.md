# Stage 4.4: Team Activity Log

**Phase:** 4 - Team Features
**Priority:** 🟡 Medium
**Estimated Effort:** Small

---

## Context

Teams need an activity log to track member actions for auditing and transparency.

---

## Task Requirements

### 1. Create Activity Log Model

**File to create:** `src/lib/db/models/TeamActivity.ts`

```typescript
interface ITeamActivity {
  teamId: string;
  userId: string;
  action: 'member_added' | 'member_removed' | 'role_changed' | 'settings_updated' | 'document_shared';
  details: Record<string, unknown>;
  createdAt: Date;
}
```

### 2. Create Activity API

**File to create:** `src/app/api/teams/[teamId]/activity/route.ts`

### 3. Create Activity Components

**Files to create:**
- `src/components/teams/ActivityLog.tsx` - Activity list
- `src/components/teams/ActivityItem.tsx` - Single activity

### 4. Log Activities

Update team service to log activities on:
- Member added/removed
- Role changed
- Team settings updated
- Team created/deleted

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Team Activity                              [Filter ▼]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Today                                                        │
│ ─────────────────────────────────────────────────────────── │
│ John added Alice to the team              2 hours ago        │
│ Jane updated team settings                5 hours ago        │
│                                                              │
│ Yesterday                                                    │
│ ─────────────────────────────────────────────────────────── │
│ John changed Bob's role to Admin          1 day ago          │
│ Jane removed Charlie from team            1 day ago          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Definition of Done

- [ ] Activity model created
- [ ] Activities logged on team actions
- [ ] Activity API works
- [ ] Activity log UI displays
- [ ] Filter by action type
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 4.4 status to ✅ Complete*
