# Milestone 3.4: Profile & Security Pages Polish

## Status: ✅ Complete
## Priority: LOW
## Estimated Scope: Small
## Completed: 2025-12-30

---

## Objective

Polish the profile and security settings pages for better UX.

---

## Current Components

### Profile:
- `src/app/[locale]/dashboard/profile/page.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/ProfileForm.tsx`
- `src/components/profile/AvatarUpload.tsx`

### Security:
- `src/app/[locale]/dashboard/security/page.tsx`
- `src/components/security/PasswordChange.tsx`
- `src/components/security/SessionList.tsx`
- `src/components/security/ConnectedAccounts.tsx`

---

## Profile Page Improvements

### 1. ProfileHeader

**Add:**
- Plan badge with color
- Member since date
- Quick stats (conversions, files)

### 2. ProfileForm

**Improve:**
- Inline validation
- Save confirmation
- Unsaved changes warning
- Field-level errors

### 3. AvatarUpload

**Improve:**
- Crop functionality
- Preview before upload
- Size/format validation
- Loading state

### 4. Email Change Flow

**Improve:**
- Clear verification steps
- Resend verification option
- Cancel pending change

---

## Security Page Improvements

### 1. PasswordChange

**Current:** Basic form
**Add:**
- Password strength meter (visual)
- Requirements checklist
- Last changed date
- Breach check (optional)

```typescript
// Password strength indicator
const requirements = [
  { label: 'At least 8 characters', met: password.length >= 8 },
  { label: 'Contains uppercase', met: /[A-Z]/.test(password) },
  { label: 'Contains lowercase', met: /[a-z]/.test(password) },
  { label: 'Contains number', met: /[0-9]/.test(password) },
];

<div className="space-y-1">
  {requirements.map(req => (
    <div className="flex items-center gap-2 text-sm">
      {req.met ? <CheckCircle className="text-green-500" /> : <Circle />}
      <span className={req.met ? 'text-green-600' : ''}>{req.label}</span>
    </div>
  ))}
</div>
```

### 2. SessionList

**Improve:**
- Device icons (desktop, mobile, tablet)
- Browser icons
- Location (if available)
- Current session highlight
- Revoke all others button

```typescript
// Session display
<div className="flex items-center gap-3">
  <DeviceIcon type={session.device} />
  <div>
    <p className="font-medium">{session.browser} on {session.os}</p>
    <p className="text-sm text-muted-foreground">
      {session.ip} · {session.location || 'Unknown location'}
    </p>
    <p className="text-xs text-muted-foreground">
      {session.isCurrent ? 'Current session' : `Last active ${formatRelative(session.lastActive)}`}
    </p>
  </div>
  {!session.isCurrent && (
    <Button variant="ghost" size="sm" onClick={() => revokeSession(session.id)}>
      Revoke
    </Button>
  )}
</div>
```

### 3. ConnectedAccounts

**Improve:**
- Account icons (GitHub, Google)
- Connected date
- Last used date
- Clear connect/disconnect states
- Warning when disconnecting last method

### 4. Two-Factor Authentication

**Add (if not exists):**
- 2FA setup flow
- Recovery codes
- Authenticator app QR code
- SMS fallback option

---

## Account Page Improvements

### 1. DataExport

**Improve:**
- Progress indicator
- Estimated time
- Email notification option
- Download when ready

### 2. DeleteAccount

**Improve:**
- Clear consequences list
- Require password confirmation
- Grace period info
- Data retention policy

---

## New Components

### 1. TwoFactorSetup

```typescript
// src/components/security/TwoFactorSetup.tsx
// QR code display
// Code verification
// Recovery codes display
```

### 2. SecurityOverview

```typescript
// src/components/security/SecurityOverview.tsx
// Security score
// Quick actions for improvements
// Last security review
```

---

## Files to Modify

1. `src/components/profile/ProfileHeader.tsx`
2. `src/components/profile/ProfileForm.tsx`
3. `src/components/profile/AvatarUpload.tsx`
4. `src/components/security/PasswordChange.tsx`
5. `src/components/security/SessionList.tsx`
6. `src/components/security/ConnectedAccounts.tsx`
7. `src/components/account/DataExport.tsx`
8. `src/components/account/DeleteAccount.tsx`

---

## Testing

1. Profile updates save correctly
2. Avatar upload works
3. Password change works
4. Session list accurate
5. Session revocation works
6. Account deletion works

---

## Acceptance Criteria

- [ ] Profile header polished
- [ ] Avatar upload with crop
- [ ] Password strength indicator
- [ ] Session list with device info
- [ ] Connected accounts clear
- [ ] Data export progress shown
- [ ] Delete account clear warnings
- [ ] All forms have validation
- [ ] Mobile responsive
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 3.4 status to ✅
2. Update progress bar
3. Add to completion log
