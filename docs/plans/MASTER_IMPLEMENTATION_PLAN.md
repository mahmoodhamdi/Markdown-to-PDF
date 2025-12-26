# Master Implementation Plan - Markdown to PDF

**Created:** December 25, 2024
**Status:** Active
**Total Phases:** 6
**Estimated Completion:** Production Ready

---

## Executive Summary

This document provides a comprehensive roadmap to bring the Markdown-to-PDF application to full production readiness. The codebase is approximately **85% complete** with solid foundations in core features, payments, and authentication.

---

## Current State Analysis

### Completed Features (85%)

| Feature | Status | Test Coverage |
|---------|--------|---------------|
| Markdown → HTML → PDF Pipeline | ✅ Complete | 96% |
| 8 Document Themes + Code Themes | ✅ Complete | 100% |
| Authentication (NextAuth + GitHub) | ✅ Complete | Working |
| 4-Tier Freemium System | ✅ Complete | 100% |
| Stripe Payments | ✅ Complete | 93% |
| Paymob Payments (Egypt) | ✅ Complete* | 98% |
| PayTabs Payments (MENA) | ✅ Complete* | 98% |
| Paddle Payments (EU) | ✅ Complete | 94% |
| Rate Limiting | ✅ Complete | 30% |
| Cloud Storage (Cloudinary) | ✅ Complete | 9% |
| Team Management Service | ✅ Complete | 4% |
| SSO/SAML Service | ✅ Complete | 2% |
| Analytics Service | ✅ Complete | 0% |
| Toast Notifications | ✅ Complete | Working |
| i18n (en/ar with RTL) | ✅ Complete | Working |
| Unit Tests | ✅ 1166 Tests Passing | Working |

*Note: Paymob/PayTabs subscription storage fixed in Stage 1.1 (December 25, 2024)

### Incomplete Features (~8%)

1. ~~**Critical:** Subscription persistence for Paymob/PayTabs~~ ✅ Fixed (Stage 1.1)
2. ~~**Critical:** Email notification service~~ ✅ Fixed (Stage 1.2)
3. ~~**High:** User profile management~~ ✅ Fixed (Stage 1.3)
4. ~~**High:** Auto-save implementation~~ ✅ Fixed (Stage 2.1)
5. ~~**Medium:** Settings page UI~~ ✅ Fixed (Stage 2.5)
6. ~~**Medium:** Subscription dashboard~~ ✅ Fixed (Stage 3.3)
7. **Medium:** Analytics dashboard UI
8. **Low:** Team collaboration UI
9. **Low:** Advanced account features

---

## Phase Overview

| Phase | Name | Priority | Stages | Status |
|-------|------|----------|--------|--------|
| 1 | Critical Fixes | 🔴 Critical | 3 | ✅ Complete |
| 2 | UI/UX Completion | 🟠 High | 5 | ✅ Complete |
| 3 | User Dashboard | 🟠 High | 4 | ✅ Complete |
| 4 | Team Features | 🟡 Medium | 4 | ✅ Complete |
| 5 | Account Management | 🟡 Medium | 4 | ✅ Complete |
| 6 | Testing & Polish | 🟢 Final | 4 | Pending |

---

## Phase 1: Critical Fixes (Production Blockers)

**Priority:** 🔴 Critical
**Prompt File:** `docs/plans/prompts/PHASE-1-CRITICAL-FIXES.md`

### Stage 1.1: Payment Subscription Persistence ✅ COMPLETE (December 25, 2024)
- ✅ Fix Paymob in-memory subscription storage
- ✅ Fix PayTabs in-memory subscription storage
- ✅ Add MongoDB models for regional subscriptions (RegionalSubscription model)
- ✅ Updated Paymob/PayTabs gateways to use MongoDB
- ✅ Updated webhook handlers to use gateway's handleWebhook method
- ✅ Unit tests (733 passing) and integration tests (16 passing) verified

### Stage 1.2: Email Notification Service ✅ COMPLETE (December 25, 2024)
- ✅ Implemented email service using nodemailer with SMTP
- ✅ Created email templates (welcome, password reset, subscription, team invitation, email change)
- ✅ Added email queue for reliability with retry logic
- ✅ Integrated with auth flow
- ✅ Unit tests passing

### Stage 1.3: User Profile Endpoints ✅ COMPLETE (December 25, 2024)
- ✅ Created `/api/users/profile` endpoint (GET/PATCH/DELETE)
- ✅ Added password change functionality (`/api/users/change-password`)
- ✅ Added email change with verification flow (`/api/users/change-email`, `/api/users/verify-email-change`)
- ✅ Added EmailChangeToken model for secure email verification
- ✅ Unit tests (810 passing) and integration tests (223 passing) verified

---

## Phase 2: UI/UX Completion

**Priority:** 🟠 High
**Prompt File:** `docs/plans/prompts/PHASE-2-UI-UX.md`

### Stage 2.1: Auto-save Implementation ✅ COMPLETE (December 25, 2024)
- ✅ Implemented debounced auto-save to localStorage (via Zustand persist middleware)
- ✅ Added save status indicator (Saving.../Saved) in EditorStats
- ✅ Added last saved timestamp with relative time display
- ✅ Integrated with editor settings (autoSave, autoSaveInterval)
- ✅ Added manual save button with Ctrl+S keyboard shortcut
- ✅ Added recovery prompt for unsaved content on page load
- ✅ Translations added (EN & AR)
- ✅ Unit tests (816 passing)

### Stage 2.2: Table of Contents Display ✅ COMPLETE (December 26, 2024)
- ✅ TOC toggle button already exists in EditorToolbar
- ✅ TOC sidebar renders in page.tsx (desktop: sidebar, mobile: collapsible)
- ✅ Implemented smooth scroll navigation to headings
- ✅ Added active heading highlight with IntersectionObserver
- ✅ Created useActiveHeading hook
- ✅ TOC state persisted in editor store
- ✅ Translations added (EN & AR)
- ✅ Unit tests (832 passing)

### Stage 2.3: Fullscreen Mode ✅ COMPLETE (December 26, 2024)
- ✅ Implemented fullscreen CSS styles in globals.css
- ✅ Added F11/ESC keyboard shortcuts
- ✅ Hide header/footer in fullscreen mode
- ✅ Added exit fullscreen overlay button
- ✅ Dynamic Maximize2/Minimize2 icons in toolbar
- ✅ Translations added (EN & AR)
- ✅ Unit tests (867 passing)

### Stage 2.4: Print Functionality ✅ COMPLETE (December 26, 2024)
- ✅ Added Ctrl+P keyboard shortcut to ConvertButton
- ✅ Created print styles utility (src/lib/print/styles.ts)
- ✅ Enhanced print CSS in globals.css
- ✅ Translations added (EN & AR)
- ✅ Unit tests passing

### Stage 2.5: Settings Page ✅ COMPLETE (December 26, 2024)
- ✅ Refactored settings page into modular components
- ✅ Created AppearanceSettings (theme mode, document/code theme, language)
- ✅ Created EditorSettings (font size, font family, tab size, toggles)
- ✅ Created ExportSettings (page size, orientation)
- ✅ Created ResetSettings with confirmation
- ✅ Created SettingRow helper component
- ✅ Unit tests (887 passing)

---

## Phase 3: User Dashboard

**Priority:** 🟠 High
**Prompt File:** `docs/plans/prompts/PHASE-3-USER-DASHBOARD.md`

### Stage 3.1: Dashboard Layout ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/page.tsx` with auth protection
- ✅ Created dashboard layout with sidebar navigation
- ✅ Created DashboardSidebar with 6 nav items
- ✅ Created DashboardOverview with welcome and quick actions
- ✅ Created QuickStats component
- ✅ Translations added (EN & AR)
- ✅ Unit tests (887 passing)

### Stage 3.2: Usage Overview ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/usage/page.tsx`
- ✅ Created UsageProgress component with color-coded bars
- ✅ Created UsageStats component with daily limits
- ✅ Created UsageHistory component with weekly chart
- ✅ Added Badge UI component
- ✅ Translations added (EN & AR)
- ✅ Unit tests (911 passing)

### Stage 3.3: Subscription Management ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/subscription/page.tsx`
- ✅ Created CurrentPlan component (status, billing, actions)
- ✅ Created PlanComparison component (upgrade/downgrade with billing toggle)
- ✅ Created BillingHistory component (invoices with status badges)
- ✅ Created Dialog UI component
- ✅ Created subscription API endpoints:
  - GET `/api/subscriptions` - Get current subscription
  - POST `/api/subscriptions/cancel` - Cancel subscription
  - GET `/api/subscriptions/invoices` - Get billing history
- ✅ Integrated with regional subscriptions (Paymob/PayTabs) and Stripe
- ✅ Translations added (EN & AR)
- ✅ Unit tests (957 passing)

### Stage 3.4: Analytics Dashboard ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/analytics/page.tsx`
- ✅ Created AnalyticsChart component with CSS-based bar charts
- ✅ Created ConversionStats component (today's conversions, API calls, uploads, downloads)
- ✅ Created ThemeUsage component (top themes with percentage bars)
- ✅ Created TemplateUsage component (top templates with usage counts)
- ✅ Added date range filter (7/14/30 days)
- ✅ Added CSV export functionality
- ✅ Translations added (EN & AR)
- ✅ Unit tests (970 passing)

---

## Phase 4: Team Features

**Priority:** 🟡 Medium
**Prompt File:** `docs/plans/prompts/PHASE-4-TEAM-FEATURES.md`

### Stage 4.1: Team Dashboard ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/teams/page.tsx`
- ✅ Created TeamList component
- ✅ Created TeamCard component with role badges
- ✅ Created CreateTeamDialog component
- ✅ Shows upgrade prompt for free/pro users
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

### Stage 4.2: Team Management UI ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/teams/[teamId]/page.tsx`
- ✅ Created TeamMembers component with member list and role badges
- ✅ Created AddMemberDialog for inviting members via email
- ✅ Created TeamSettings component with:
  - Team name editing
  - Member invite settings
  - Default role configuration
  - Shared storage/templates toggles
  - Team deletion (owner only)
- ✅ Role change functionality (make admin/remove admin)
- ✅ Remove member with confirmation
- ✅ Leave team functionality
- ✅ Created alert-dialog UI component
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

### Stage 4.3: Team Invitations ✅ COMPLETE (December 26, 2024)
- ✅ Created TeamInvitation model with token, status, expiration
- ✅ Created invitation-service.ts with:
  - createInvitation - Creates invitation and sends email
  - getInvitationByToken - Retrieves invitation details
  - acceptInvitation - Adds user to team
  - declineInvitation - Marks invitation as declined
  - getTeamInvitations - Lists pending invitations for a team
  - getUserInvitations - Lists pending invitations for a user
  - cancelInvitation - Revokes an invitation
  - resendInvitation - Resends invitation email
- ✅ Created invitation APIs:
  - GET/POST `/api/teams/[teamId]/invitations` - List/create invitations
  - DELETE `/api/teams/[teamId]/invitations/[invitationId]` - Cancel invitation
  - POST `.../[invitationId]/resend` - Resend invitation
  - GET `/api/invitations/[token]` - Get invitation by token
  - POST `/api/invitations/[token]/accept` - Accept invitation
  - POST `/api/invitations/[token]/decline` - Decline invitation
  - GET `/api/invitations` - Get user's pending invitations
- ✅ Created `/[locale]/invitation/[token]/page.tsx` accept/decline page
- ✅ Email already uses team-invitation template
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

### Stage 4.4: Team Activity ✅ COMPLETE (December 26, 2024)
- ✅ Created TeamActivity model with action types
- ✅ Created activity-service.ts with logging and query functions
- ✅ Created `/api/teams/[teamId]/activity` API with pagination and CSV export
- ✅ Created ActivityLog and ActivityItem components
- ✅ Added activity tab to team detail page
- ✅ Integrated activity logging into team and invitation services
- ✅ Added filter by action type
- ✅ Added CSV export for admins/owners
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

---

## Phase 5: Account Management

**Priority:** 🟡 Medium
**Prompt File:** `docs/plans/prompts/PHASE-5-ACCOUNT-MANAGEMENT.md`

### Stage 5.1: Profile Page ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/profile/page.tsx`
- ✅ Created ProfileHeader component with avatar and user info
- ✅ Created ProfileForm component with name editing and email change
- ✅ Created AvatarUpload component with drag/drop and preview
- ✅ Created Avatar UI component
- ✅ Created `/api/storage/avatar` endpoint with Cloudinary resizing
- ✅ Email change triggers verification flow
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

### Stage 5.2: Security Settings ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/security/page.tsx`
- ✅ Created PasswordChange component with strength indicator
- ✅ Created SessionList component with device info and revocation
- ✅ Created ConnectedAccounts component for OAuth connections
- ✅ Created Session and Account MongoDB models
- ✅ Created `/api/users/sessions` endpoint (list, revoke, revoke all)
- ✅ Created `/api/users/accounts` endpoint (list, disconnect)
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

### Stage 5.3: Email Verification ✅ COMPLETE (December 26, 2024)
- ✅ Created EmailVerificationToken model with secure token hashing
- ✅ Created `/api/auth/verify-email` endpoint for token verification
- ✅ Created `/api/auth/resend-verification` endpoint with rate limiting
- ✅ Created `/[locale]/verify-email/[token]/page.tsx` verification page
- ✅ Updated registration flow to send verification email
- ✅ Created EmailVerificationBanner component for dashboard
- ✅ Extended NextAuth session to include emailVerified status
- ✅ Translations added (EN & AR)
- ✅ Unit tests (830 passing)

### Stage 5.4: Account Actions ✅ COMPLETE (December 26, 2024)
- ✅ Created `/[locale]/dashboard/account/page.tsx` account page
- ✅ Created DataExport component with ZIP download
- ✅ Created DeleteAccount component with confirmation dialog
- ✅ Created `/api/users/export` API (GDPR data export as ZIP)
- ✅ Enhanced `/api/users/profile` DELETE to properly clean up:
  - Cancel all subscriptions (Stripe, Paymob, PayTabs)
  - Remove from teams or transfer ownership
  - Delete all files from storage
  - Delete all user data (usage, sessions, tokens)
  - Send confirmation email
- ✅ Created account deletion email template
- ✅ Updated dashboard sidebar to include profile, security, account
- ✅ Translations added (EN & AR)
- ✅ Unit tests (990 passing)

---

## Phase 6: Testing & Polish

**Priority:** 🟢 Final
**Prompt File:** `docs/plans/prompts/PHASE-6-TESTING-POLISH.md`

### Stage 6.1: Service Layer Tests ✅ COMPLETE (December 26, 2024)
- ✅ PDF Generator tests (50 tests) - HTML generation, themes, edge cases
- ✅ Browser Pool tests (20+ tests) - getBrowser, getPage, releasePage, concurrency
- ✅ Teams service tests (40+ tests) - CRUD, role validation, permissions
- ✅ Storage service tests (46 tests) - quota, file operations, MIME types
- ✅ Analytics service tests (38 tests) - event tracking, daily limits, history
- ✅ Unit tests (1166 passing) verified

### Stage 6.2: Integration Tests
- Payment webhook tests
- SSO login flow tests
- Storage upload/quota tests
- Team member operation tests

### Stage 6.3: E2E Tests
- New dashboard flows
- Team management flows
- Settings page tests
- Profile management tests

### Stage 6.4: Performance & Polish
- Browser pool optimization
- Image optimization in PDFs
- Bundle size optimization
- Accessibility audit
- Security audit

---

## Definition of Done (Per Stage)

Each stage must meet these criteria before completion:

- [ ] Feature fully implemented
- [ ] Unit tests written and passing
- [ ] Integration tests (if API changes)
- [ ] E2E tests (if UI changes)
- [ ] Translations updated (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Manual testing complete
- [ ] Code reviewed and merged

---

## File Structure for Prompts

```
docs/plans/prompts/
├── PHASE-1-CRITICAL-FIXES.md
│   ├── STAGE-1.1-PAYMENT-PERSISTENCE.md
│   ├── STAGE-1.2-EMAIL-SERVICE.md
│   └── STAGE-1.3-USER-PROFILE-API.md
├── PHASE-2-UI-UX.md
│   ├── STAGE-2.1-AUTO-SAVE.md
│   ├── STAGE-2.2-TABLE-OF-CONTENTS.md
│   ├── STAGE-2.3-FULLSCREEN-MODE.md
│   ├── STAGE-2.4-PRINT-FUNCTIONALITY.md
│   └── STAGE-2.5-SETTINGS-PAGE.md
├── PHASE-3-USER-DASHBOARD.md
│   ├── STAGE-3.1-DASHBOARD-LAYOUT.md
│   ├── STAGE-3.2-USAGE-OVERVIEW.md
│   ├── STAGE-3.3-SUBSCRIPTION-MANAGEMENT.md
│   └── STAGE-3.4-ANALYTICS-DASHBOARD.md
├── PHASE-4-TEAM-FEATURES.md
│   ├── STAGE-4.1-TEAM-DASHBOARD.md
│   ├── STAGE-4.2-TEAM-MANAGEMENT-UI.md
│   ├── STAGE-4.3-TEAM-INVITATIONS.md
│   └── STAGE-4.4-TEAM-ACTIVITY.md
├── PHASE-5-ACCOUNT-MANAGEMENT.md
│   ├── STAGE-5.1-PROFILE-PAGE.md
│   ├── STAGE-5.2-SECURITY-SETTINGS.md
│   ├── STAGE-5.3-EMAIL-VERIFICATION.md
│   └── STAGE-5.4-ACCOUNT-ACTIONS.md
└── PHASE-6-TESTING-POLISH.md
    ├── STAGE-6.1-SERVICE-TESTS.md
    ├── STAGE-6.2-INTEGRATION-TESTS.md
    ├── STAGE-6.3-E2E-TESTS.md
    └── STAGE-6.4-PERFORMANCE-POLISH.md
```

---

## How to Use This Plan

1. **Start with Phase 1** - These are production blockers
2. **Follow stages in order** within each phase
3. **Use the prompt files** - Each stage has a detailed prompt file
4. **Run the prompt** - Copy the prompt file path and send it to Claude
5. **Verify completion** - Use the Definition of Done checklist
6. **Move to next stage** - Only after current stage is complete

### Example Usage

```
User: Start with docs/plans/prompts/STAGE-1.1-PAYMENT-PERSISTENCE.md
Claude: [Reads the file and implements the stage]
```

---

## Progress Tracking

| Phase | Stage | Status | Date Started | Date Completed |
|-------|-------|--------|--------------|----------------|
| 1 | 1.1 | ✅ Complete | Dec 25, 2024 | Dec 25, 2024 |
| 1 | 1.2 | ✅ Complete | Dec 25, 2024 | Dec 25, 2024 |
| 1 | 1.3 | ✅ Complete | Dec 25, 2024 | Dec 25, 2024 |
| 2 | 2.1 | ✅ Complete | Dec 25, 2024 | Dec 25, 2024 |
| 2 | 2.2 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 2 | 2.3 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 2 | 2.4 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 2 | 2.5 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 3 | 3.1 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 3 | 3.2 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 3 | 3.3 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 3 | 3.4 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 4 | 4.1 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 4 | 4.2 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 4 | 4.3 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 4 | 4.4 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 5 | 5.1 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 5 | 5.2 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 5 | 5.3 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 5 | 5.4 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 6 | 6.1 | ✅ Complete | Dec 26, 2024 | Dec 26, 2024 |
| 6 | 6.2 | ⏳ Pending | - | - |
| 6 | 6.3 | ⏳ Pending | - | - |
| 6 | 6.4 | ⏳ Pending | - | - |

---

*Last Updated: December 26, 2024 - Stage 6.1 Complete (Service Layer Tests - 1166 tests passing)*
