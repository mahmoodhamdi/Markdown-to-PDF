import { describe, it, expect, vi } from 'vitest';
import { getPlanLimits } from '@/lib/plans/config';

// Mock MongoDB connection first (must be before any imports that use it)
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock the Firebase admin module before importing rate-limit
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {},
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

// Mock the auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock the rate-limit module
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({ 'X-RateLimit-Remaining': '10' }),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

// Import after mocks are set up
import {
  checkFileSizeLimit,
  checkBatchCountLimit,
  RateLimitContext,
} from '@/lib/plans/rate-limit';

describe('Plan Rate Limiting', () => {
  describe('checkFileSizeLimit', () => {
    const anonymousContext: RateLimitContext = {
      isAuthenticated: false,
      userEmail: null,
      userPlan: 'free',
      ip: '127.0.0.1',
      authType: 'anonymous',
    };

    const freeUserContext: RateLimitContext = {
      isAuthenticated: true,
      userEmail: 'test@example.com',
      userPlan: 'free',
      ip: '127.0.0.1',
      authType: 'session',
    };

    const proUserContext: RateLimitContext = {
      isAuthenticated: true,
      userEmail: 'test@example.com',
      userPlan: 'pro',
      ip: '127.0.0.1',
      authType: 'session',
    };

    const teamUserContext: RateLimitContext = {
      isAuthenticated: true,
      userEmail: 'test@example.com',
      userPlan: 'team',
      ip: '127.0.0.1',
      authType: 'session',
    };

    describe('Anonymous users', () => {
      it('should allow small files', () => {
        const result = checkFileSizeLimit(50 * 1024, anonymousContext); // 50 KB
        expect(result.success).toBe(true);
      });

      it('should reject files over 100 KB', () => {
        const result = checkFileSizeLimit(150 * 1024, anonymousContext); // 150 KB
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
        expect(result.error).toContain('exceeds limit');
        expect(result.error).toContain('Sign up');
      });
    });

    describe('Free plan users', () => {
      it('should allow files up to 500 KB', () => {
        const result = checkFileSizeLimit(400 * 1024, freeUserContext);
        expect(result.success).toBe(true);
      });

      it('should reject files over 500 KB', () => {
        const result = checkFileSizeLimit(600 * 1024, freeUserContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
        expect(result.error).toContain('Upgrade to Pro');
      });
    });

    describe('Pro plan users', () => {
      it('should allow files up to 5 MB', () => {
        const result = checkFileSizeLimit(4 * 1024 * 1024, proUserContext);
        expect(result.success).toBe(true);
      });

      it('should reject files over 5 MB', () => {
        const result = checkFileSizeLimit(6 * 1024 * 1024, proUserContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
      });
    });

    describe('Team plan users', () => {
      it('should allow files up to 20 MB', () => {
        const result = checkFileSizeLimit(15 * 1024 * 1024, teamUserContext);
        expect(result.success).toBe(true);
      });

      it('should reject files over 20 MB', () => {
        const result = checkFileSizeLimit(25 * 1024 * 1024, teamUserContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
      });
    });
  });

  describe('checkBatchCountLimit', () => {
    const anonymousContext: RateLimitContext = {
      isAuthenticated: false,
      userEmail: null,
      userPlan: 'free',
      ip: '127.0.0.1',
      authType: 'anonymous',
    };

    const freeUserContext: RateLimitContext = {
      isAuthenticated: true,
      userEmail: 'test@example.com',
      userPlan: 'free',
      ip: '127.0.0.1',
      authType: 'session',
    };

    const proUserContext: RateLimitContext = {
      isAuthenticated: true,
      userEmail: 'test@example.com',
      userPlan: 'pro',
      ip: '127.0.0.1',
      authType: 'session',
    };

    const teamUserContext: RateLimitContext = {
      isAuthenticated: true,
      userEmail: 'test@example.com',
      userPlan: 'team',
      ip: '127.0.0.1',
      authType: 'session',
    };

    describe('Anonymous users', () => {
      it('should allow up to 2 files', () => {
        const result = checkBatchCountLimit(2, anonymousContext);
        expect(result.success).toBe(true);
      });

      it('should reject more than 2 files', () => {
        const result = checkBatchCountLimit(5, anonymousContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
        expect(result.error).toContain('Sign up');
      });
    });

    describe('Free plan users', () => {
      it('should allow up to 5 files', () => {
        const result = checkBatchCountLimit(5, freeUserContext);
        expect(result.success).toBe(true);
      });

      it('should reject more than 5 files', () => {
        const result = checkBatchCountLimit(10, freeUserContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
        expect(result.error).toContain('Upgrade to Pro');
      });
    });

    describe('Pro plan users', () => {
      it('should allow up to 50 files', () => {
        const result = checkBatchCountLimit(50, proUserContext);
        expect(result.success).toBe(true);
      });

      it('should reject more than 50 files', () => {
        const result = checkBatchCountLimit(60, proUserContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
      });
    });

    describe('Team plan users', () => {
      it('should allow up to 200 files', () => {
        const result = checkBatchCountLimit(200, teamUserContext);
        expect(result.success).toBe(true);
      });

      it('should reject more than 200 files', () => {
        const result = checkBatchCountLimit(250, teamUserContext);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(413);
      });
    });
  });

  describe('Plan limits integration', () => {
    it('should have increasing limits from free to enterprise', () => {
      const freeLimits = getPlanLimits('free');
      const proLimits = getPlanLimits('pro');
      const teamLimits = getPlanLimits('team');
      const enterpriseLimits = getPlanLimits('enterprise');

      // Conversions per day should increase
      expect(freeLimits.conversionsPerDay).toBeLessThan(proLimits.conversionsPerDay);
      expect(proLimits.conversionsPerDay).toBeLessThan(teamLimits.conversionsPerDay);

      // Max file size should increase
      expect(freeLimits.maxFileSize).toBeLessThan(proLimits.maxFileSize);
      expect(proLimits.maxFileSize).toBeLessThan(teamLimits.maxFileSize);
      expect(teamLimits.maxFileSize).toBeLessThan(enterpriseLimits.maxFileSize);

      // API calls should increase
      expect(freeLimits.apiCallsPerDay).toBeLessThan(proLimits.apiCallsPerDay);
      expect(proLimits.apiCallsPerDay).toBeLessThan(teamLimits.apiCallsPerDay);
      expect(teamLimits.apiCallsPerDay).toBeLessThan(enterpriseLimits.apiCallsPerDay);

      // Batch files should increase
      expect(freeLimits.maxBatchFiles).toBeLessThan(proLimits.maxBatchFiles);
      expect(proLimits.maxBatchFiles).toBeLessThan(teamLimits.maxBatchFiles);
    });

    it('should have watermark only on free plan', () => {
      expect(getPlanLimits('free').hasWatermark).toBe(true);
      expect(getPlanLimits('pro').hasWatermark).toBe(false);
      expect(getPlanLimits('team').hasWatermark).toBe(false);
      expect(getPlanLimits('enterprise').hasWatermark).toBe(false);
    });

    it('should have custom CSS only on paid plans', () => {
      expect(getPlanLimits('free').customCssAllowed).toBe(false);
      expect(getPlanLimits('pro').customCssAllowed).toBe(true);
      expect(getPlanLimits('team').customCssAllowed).toBe(true);
      expect(getPlanLimits('enterprise').customCssAllowed).toBe(true);
    });

    it('should have team members only on team and enterprise plans', () => {
      expect(getPlanLimits('free').teamMembersAllowed).toBe(0);
      expect(getPlanLimits('pro').teamMembersAllowed).toBe(0);
      expect(getPlanLimits('team').teamMembersAllowed).toBe(5);
      expect(getPlanLimits('enterprise').teamMembersAllowed).toBe(Infinity);
    });

    it('should have priority rendering only on team and enterprise plans', () => {
      expect(getPlanLimits('free').priorityRendering).toBe(false);
      expect(getPlanLimits('pro').priorityRendering).toBe(false);
      expect(getPlanLimits('team').priorityRendering).toBe(true);
      expect(getPlanLimits('enterprise').priorityRendering).toBe(true);
    });
  });
});
