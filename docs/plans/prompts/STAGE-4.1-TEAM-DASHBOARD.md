# Stage 4.1: Team Dashboard

**Phase:** 4 - Team Features
**Priority:** 🟡 Medium
**Estimated Effort:** Medium

---

## Context

Team management service exists but no UI. Users with Team/Enterprise plans need to manage their teams.

---

## Task Requirements

### 1. Create Teams Page

**File to create:** `src/app/[locale]/dashboard/teams/page.tsx`

Lists all teams the user belongs to or owns.

### 2. Create Team Components

**Files to create:**
- `src/components/teams/TeamList.tsx` - List of teams
- `src/components/teams/TeamCard.tsx` - Team preview card
- `src/components/teams/CreateTeamDialog.tsx` - Create new team

### 3. Use Existing APIs

**Existing endpoints:**
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Teams                                     [+ Create Team]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ My Company ─────────────────────────────────────────────┐ │
│ │ 5 members • Owner • Created Dec 2024                     │ │
│ │ [Manage]                                                  │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Project Alpha ──────────────────────────────────────────┐ │
│ │ 3 members • Member • Joined Nov 2024                     │ │
│ │ [View]                                                    │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Requirements

- [ ] Teams list loads
- [ ] Create team works
- [ ] Team cards display correctly
- [ ] Role shown correctly

---

## Definition of Done

- [ ] Teams page created
- [ ] Team list works
- [ ] Create team dialog works
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 4.1 status to ✅ Complete*
