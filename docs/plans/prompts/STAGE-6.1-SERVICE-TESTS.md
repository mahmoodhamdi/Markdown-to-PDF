# Stage 6.1: Service Layer Tests

**Phase:** 6 - Testing & Polish
**Priority:** 🟢 Final
**Estimated Effort:** Large

---

## Context

Service layer has low test coverage. Need to achieve 90%+ coverage on core services.

### Current Coverage

| Service | Current | Target |
|---------|---------|--------|
| SSO Service | 2.93% | 90% |
| Teams Service | 4.25% | 90% |
| Storage Service | 9.49% | 90% |
| Analytics Service | 0% | 90% |
| PDF Generator | 0% | 80% |
| Browser Pool | 0% | 80% |

---

## Task Requirements

### 1. SSO Service Tests

**File to create:** `__tests__/unit/lib/sso/service.test.ts`

Test cases:
- [ ] createSSOConfig creates config
- [ ] getSSOConfig returns config
- [ ] updateSSOConfig updates correctly
- [ ] deleteSSOConfig removes config
- [ ] getSSOConfigByDomain finds by domain
- [ ] addDomain adds domain mapping
- [ ] removeDomain removes mapping
- [ ] verifyDomain verifies domain
- [ ] testProvider tests connection
- [ ] logAuditEvent logs events
- [ ] getAuditLogs returns logs

### 2. Teams Service Tests

**File to create:** `__tests__/unit/lib/teams/service.test.ts`

Test cases:
- [ ] createTeam creates team
- [ ] getTeam returns team
- [ ] updateTeam updates team
- [ ] deleteTeam removes team
- [ ] addMember adds member
- [ ] removeMember removes member
- [ ] getMemberRole returns role
- [ ] updateMemberRole updates role
- [ ] getTeamsByUser returns user's teams
- [ ] checkTeamLimit enforces limits

### 3. Storage Service Tests

**File to create:** `__tests__/unit/lib/storage/service.test.ts`

Test cases:
- [ ] uploadFile uploads successfully
- [ ] downloadFile returns file
- [ ] deleteFile removes file
- [ ] listFiles returns user files
- [ ] getQuota returns usage
- [ ] checkQuota enforces limits
- [ ] validateMimeType rejects invalid
- [ ] Handles Cloudinary errors

### 4. Analytics Service Tests

**File to create:** `__tests__/unit/lib/analytics/service.test.ts`

Test cases:
- [ ] trackEvent logs event
- [ ] getDailySummary aggregates data
- [ ] getUsageSummary returns summary
- [ ] getUsageHistory returns history
- [ ] Handles date ranges correctly

### 5. PDF Generator Tests

**File to create:** `__tests__/unit/lib/pdf/generator.test.ts`

Test cases:
- [ ] generateHtmlDocument creates HTML
- [ ] generatePdf creates PDF buffer
- [ ] Applies theme correctly
- [ ] Handles page settings
- [ ] Handles headers/footers
- [ ] Batch conversion works

### 6. Browser Pool Tests

**File to create:** `__tests__/unit/lib/pdf/browser-pool.test.ts`

Test cases:
- [ ] Acquires browser instance
- [ ] Returns browser to pool
- [ ] Creates new browser when empty
- [ ] Respects max pool size
- [ ] Handles browser crashes
- [ ] Cleans up idle browsers

---

## Mocking Strategy

### External Services

```typescript
// Mock Cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
    api: {
      resources: vi.fn(),
    },
  },
}));

// Mock Puppeteer
vi.mock('puppeteer', () => ({
  launch: vi.fn(() => ({
    newPage: vi.fn(),
    close: vi.fn(),
  })),
}));
```

### Database

```typescript
// Use in-memory MongoDB for tests
import { MongoMemoryServer } from 'mongodb-memory-server';
```

---

## Running Tests

```bash
# Run all unit tests with coverage
npm run test:coverage

# Run specific service tests
npx vitest run __tests__/unit/lib/sso
npx vitest run __tests__/unit/lib/teams
npx vitest run __tests__/unit/lib/storage
npx vitest run __tests__/unit/lib/analytics
npx vitest run __tests__/unit/lib/pdf
```

---

## Definition of Done

- [ ] SSO Service: 90%+ coverage
- [ ] Teams Service: 90%+ coverage
- [ ] Storage Service: 90%+ coverage
- [ ] Analytics Service: 90%+ coverage
- [ ] PDF Generator: 80%+ coverage
- [ ] Browser Pool: 80%+ coverage
- [ ] All tests pass
- [ ] No flaky tests
- [ ] Mocks properly isolated

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 6.1 status to ✅ Complete*
