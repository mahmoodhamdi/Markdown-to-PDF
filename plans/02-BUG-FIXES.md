# Phase 2: Bug Fixes

## 2.1 User.findById(email) -> User.findOne({ email })
- [ ] Fix in auth/register/route.ts
- [ ] Fix in users/profile/route.ts (GET and DELETE)
- [ ] Fix in users/change-password/route.ts
- [ ] Fix in auth/reset-password/route.ts
- [ ] Fix in webhooks/stripe/route.ts (all occurrences)
- [ ] Fix any other occurrences across all API routes

## 2.2 EditorToolbar Active State
- [ ] Add `id` field to toolbar actions
- [ ] Compare by id instead of translated label string

## 2.3 Dashboard Overview Hardcoded Values
- [ ] Import plan limits from config instead of hardcoding
- [ ] Fetch real storage data instead of hardcoded "0 MB"/"100 MB"

## 2.4 Mermaid Initialization
- [ ] Initialize mermaid once using useRef flag
- [ ] Re-render diagrams on theme change without re-initializing

## 2.5 Register Page Password Validation
- [ ] Match client-side validation with server requirements (8 chars, uppercase, lowercase, number, special char)

## 2.6 Payment Action Required Notification
- [ ] Send email notification when 3D Secure authentication is required (using existing email service)

## 2.7 Preview Flash Fix
- [ ] Unify empty state check to use debouncedContent

## Next: Execute `03-MISSING-PAGES.md`
