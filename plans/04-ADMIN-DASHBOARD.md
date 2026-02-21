# Phase 4: Admin Dashboard

## 4.1 Admin Role in User Model
- [ ] Add `role` field to User model: 'user' | 'admin'
- [ ] Create admin middleware for API route protection

## 4.2 Admin API Routes
- [ ] GET /api/admin/stats - System-wide statistics
- [ ] GET /api/admin/users - List all users with pagination/search
- [ ] PATCH /api/admin/users/[userId] - Update user plan/role/status
- [ ] GET /api/admin/analytics - System-wide analytics
- [ ] GET /api/admin/webhooks - Recent webhook events
- [ ] GET /api/admin/conversions - Conversion statistics

## 4.3 Admin Dashboard Pages
- [ ] Create `/[locale]/admin/layout.tsx` - Admin layout with sidebar
- [ ] Create `/[locale]/admin/page.tsx` - Admin overview (total users, conversions, revenue)
- [ ] Create `/[locale]/admin/users/page.tsx` - User management table
- [ ] Create `/[locale]/admin/analytics/page.tsx` - System analytics with charts
- [ ] Create `/[locale]/admin/webhooks/page.tsx` - Webhook event viewer

## 4.4 Admin Navigation
- [ ] Add admin link to UserMenu (visible only for admin role)
- [ ] Admin sidebar with navigation items

## 4.5 Admin Translations
- [ ] Add admin translations to en.json and ar.json

## Next: Execute `05-UI-UX-IMPROVEMENTS.md`
