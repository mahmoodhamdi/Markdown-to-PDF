# Phase 3: Missing Pages & Features

## 3.1 Forgot Password Page
- [ ] Create `/[locale]/auth/forgot-password/page.tsx`
- [ ] Email input form with validation
- [ ] Success state showing "check your email"
- [ ] Link from login page to forgot-password
- [ ] Add translations to en.json and ar.json

## 3.2 Reset Password Page
- [ ] Create `/[locale]/auth/reset-password/[token]/page.tsx`
- [ ] New password + confirm password form
- [ ] Password strength validation matching server requirements
- [ ] Success/error/expired/loading states
- [ ] Add translations to en.json and ar.json

## 3.3 Error Boundaries
- [ ] Create `src/app/[locale]/error.tsx` (locale-level error boundary)
- [ ] Create `src/app/global-error.tsx` (root-level error boundary)
- [ ] Create `src/app/[locale]/dashboard/error.tsx` (dashboard error boundary)
- [ ] Proper error UI with retry button

## 3.4 Loading Pages
- [ ] Create `src/app/[locale]/loading.tsx`
- [ ] Create `src/app/[locale]/dashboard/loading.tsx`

## Next: Execute `04-ADMIN-DASHBOARD.md`
