/**
 * Analytics Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock Usage models
const mockUsageEventCreate = vi.fn();
const mockUsageEventCountDocuments = vi.fn();
const mockUsageEventDeleteMany = vi.fn();

const mockDailyUsageFindOneResult = vi.fn();
const mockDailyUsageFindResult = vi.fn();
const mockDailyUsageFindOneAndUpdate = vi.fn();
const mockDailyUsageAggregate = vi.fn();

// Helper to create chainable mock with .lean()
const createLeanableQuery = (resultFn: ReturnType<typeof vi.fn>) => ({
  lean: () => resultFn(),
});

// Helper to create chainable mock with .sort().lean()
const createSortableLeanableQuery = (resultFn: ReturnType<typeof vi.fn>) => ({
  sort: () => ({
    lean: () => resultFn(),
  }),
});

vi.mock('@/lib/db/models/Usage', () => ({
  UsageEvent: {
    create: (...args: unknown[]) => mockUsageEventCreate(...args),
    countDocuments: (...args: unknown[]) => mockUsageEventCountDocuments(...args),
    deleteMany: (...args: unknown[]) => mockUsageEventDeleteMany(...args),
  },
  DailyUsage: {
    findOne: () => createLeanableQuery(mockDailyUsageFindOneResult),
    find: () => createSortableLeanableQuery(mockDailyUsageFindResult),
    findOneAndUpdate: (...args: unknown[]) => mockDailyUsageFindOneAndUpdate(...args),
    aggregate: (...args: unknown[]) => mockDailyUsageAggregate(...args),
  },
}));

// Mock plan config
vi.mock('@/lib/plans/config', () => ({
  getPlanLimits: vi.fn((plan: string) => {
    const limits: Record<string, { conversionsPerDay: number; apiCallsPerDay: number }> = {
      free: { conversionsPerDay: 5, apiCallsPerDay: 10 },
      pro: { conversionsPerDay: 100, apiCallsPerDay: 500 },
      team: { conversionsPerDay: 500, apiCallsPerDay: 2000 },
      enterprise: { conversionsPerDay: Infinity, apiCallsPerDay: Infinity },
    };
    return limits[plan] || limits.free;
  }),
}));

import {
  trackEvent,
  getDailyUsage,
  getUsageRange,
  getUsageSummary,
  getUsageHistory,
  checkDailyLimits,
  getTotalEventCount,
  cleanupOldEvents,
} from '@/lib/analytics/service';

describe('Analytics Service - Event Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should create usage event and update daily aggregation', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'conversion', { source: 'web' });

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          eventType: 'conversion',
          metadata: { source: 'web' },
        })
      );
      expect(mockDailyUsageFindOneAndUpdate).toHaveBeenCalled();
    });

    it('should track API call events', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'api_call');

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          eventType: 'api_call',
        })
      );
    });

    it('should track file upload events', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'file_upload', { fileSize: 1024 });

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'file_upload',
          metadata: { fileSize: 1024 },
        })
      );
    });

    it('should track file download events', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'file_download');

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'file_download',
        })
      );
    });

    it('should track template usage events', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'template_used', { templateId: 'academic' });

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'template_used',
        })
      );
    });

    it('should track batch conversion events', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'batch_conversion', { fileCount: 5 });

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'batch_conversion',
        })
      );
    });

    it('should not throw on database error', async () => {
      mockUsageEventCreate.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(trackEvent('user-123', 'conversion')).resolves.not.toThrow();
    });

    it('should handle missing metadata', async () => {
      mockUsageEventCreate.mockResolvedValue({});
      mockDailyUsageFindOneAndUpdate.mockResolvedValue({});

      await trackEvent('user-123', 'conversion');

      expect(mockUsageEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        })
      );
    });
  });
});

describe('Analytics Service - Daily Usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDailyUsage', () => {
    it('should return usage data for specific date', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 10,
        apiCalls: 50,
        fileUploads: 5,
        fileDownloads: 3,
        templatesUsed: 2,
        batchConversions: 1,
        storageUsed: 1024,
      });

      const usage = await getDailyUsage('user-123', '2024-01-15');

      expect(usage.conversions).toBe(10);
      expect(usage.apiCalls).toBe(50);
      expect(usage.fileUploads).toBe(5);
      expect(usage.date).toBe('2024-01-15');
    });

    it('should return zero values for new user', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue(null);

      const usage = await getDailyUsage('new-user', '2024-01-15');

      expect(usage.conversions).toBe(0);
      expect(usage.apiCalls).toBe(0);
      expect(usage.fileUploads).toBe(0);
      expect(usage.fileDownloads).toBe(0);
      expect(usage.templatesUsed).toBe(0);
      expect(usage.batchConversions).toBe(0);
      expect(usage.storageUsed).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockDailyUsageFindOneResult.mockRejectedValue(new Error('Database error'));

      const usage = await getDailyUsage('user-123', '2024-01-15');

      expect(usage.conversions).toBe(0);
      expect(usage.apiCalls).toBe(0);
    });

    it('should handle partial data', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 5,
        // Other fields missing
      });

      const usage = await getDailyUsage('user-123', '2024-01-15');

      expect(usage.conversions).toBe(5);
      expect(usage.apiCalls).toBe(0);
      expect(usage.fileUploads).toBe(0);
    });
  });
});

describe('Analytics Service - Usage Range', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsageRange', () => {
    it('should aggregate usage for date range', async () => {
      mockDailyUsageAggregate.mockResolvedValue([
        {
          conversions: 25,
          apiCalls: 100,
          fileUploads: 10,
          fileDownloads: 8,
          templatesUsed: 5,
          batchConversions: 3,
          storageUsed: 2048,
        },
      ]);

      const usage = await getUsageRange('user-123', '2024-01-01', '2024-01-07');

      expect(usage.conversions).toBe(25);
      expect(usage.apiCalls).toBe(100);
      expect(usage.date).toBe('2024-01-01 to 2024-01-07');
    });

    it('should return zero values for empty range', async () => {
      mockDailyUsageAggregate.mockResolvedValue([]);

      const usage = await getUsageRange('user-123', '2024-01-01', '2024-01-07');

      expect(usage.conversions).toBe(0);
      expect(usage.apiCalls).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDailyUsageAggregate.mockRejectedValue(new Error('Aggregation error'));

      const usage = await getUsageRange('user-123', '2024-01-01', '2024-01-07');

      expect(usage.conversions).toBe(0);
      expect(usage.date).toBe('2024-01-01 to 2024-01-07');
    });
  });
});

describe('Analytics Service - Usage Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsageSummary', () => {
    it('should return complete usage summary', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 3,
        apiCalls: 5,
        fileUploads: 1,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 512,
      });
      mockDailyUsageAggregate.mockResolvedValue([
        {
          conversions: 20,
          apiCalls: 50,
          fileUploads: 5,
          fileDownloads: 3,
          templatesUsed: 2,
          batchConversions: 1,
          storageUsed: 1024,
        },
      ]);

      const summary = await getUsageSummary('user-123', 'free');

      expect(summary.today).toBeDefined();
      expect(summary.thisWeek).toBeDefined();
      expect(summary.thisMonth).toBeDefined();
      expect(summary.limits).toBeDefined();
      expect(summary.remaining).toBeDefined();
    });

    it('should calculate remaining usage correctly for free plan', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 3,
        apiCalls: 5,
      });
      mockDailyUsageAggregate.mockResolvedValue([]);

      const summary = await getUsageSummary('user-123', 'free');

      expect(summary.remaining.conversionsToday).toBe(2); // 5 - 3
      expect(summary.remaining.apiCallsToday).toBe(5); // 10 - 5
    });

    it('should return Infinity remaining for enterprise plan', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 1000,
        apiCalls: 5000,
      });
      mockDailyUsageAggregate.mockResolvedValue([]);

      const summary = await getUsageSummary('user-123', 'enterprise');

      expect(summary.remaining.conversionsToday).toBe(Infinity);
      expect(summary.remaining.apiCallsToday).toBe(Infinity);
    });

    it('should not go negative on remaining', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 10, // Over limit for free plan (5)
        apiCalls: 20, // Over limit for free plan (10)
      });
      mockDailyUsageAggregate.mockResolvedValue([]);

      const summary = await getUsageSummary('user-123', 'free');

      expect(summary.remaining.conversionsToday).toBe(0);
      expect(summary.remaining.apiCallsToday).toBe(0);
    });
  });
});

describe('Analytics Service - Usage History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsageHistory', () => {
    it('should return usage history for specified days', async () => {
      mockDailyUsageFindResult.mockResolvedValue([
        { date: '2024-01-14', conversions: 5, apiCalls: 10 },
        { date: '2024-01-15', conversions: 3, apiCalls: 8 },
      ]);

      const history = await getUsageHistory('user-123', 7);

      expect(history).toBeDefined();
      expect(history.daily).toBeDefined();
      expect(history.startDate).toBeDefined();
      expect(history.endDate).toBeDefined();
    });

    it('should fill in missing days with zeros', async () => {
      mockDailyUsageFindResult.mockResolvedValue([]);

      const history = await getUsageHistory('user-123', 7);

      // The exact count depends on the implementation's date range calculation
      expect(history.daily.length).toBeGreaterThanOrEqual(6);
      expect(history.daily.length).toBeLessThanOrEqual(8);
      history.daily.forEach((day) => {
        expect(day.conversions).toBe(0);
        expect(day.apiCalls).toBe(0);
      });
    });

    it('should handle database errors', async () => {
      mockDailyUsageFindResult.mockRejectedValue(new Error('Database error'));

      const history = await getUsageHistory('user-123', 7);

      expect(history.daily).toEqual([]);
    });

    it('should use default of 30 days', async () => {
      mockDailyUsageFindResult.mockResolvedValue([]);

      const history = await getUsageHistory('user-123');

      // The exact count depends on the implementation's date range calculation
      expect(history.daily.length).toBeGreaterThanOrEqual(29);
      expect(history.daily.length).toBeLessThanOrEqual(31);
    });
  });
});

describe('Analytics Service - Daily Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDailyLimits', () => {
    it('should return within limits when usage is low', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 2,
        apiCalls: 5,
      });

      const result = await checkDailyLimits('user-123', 'free');

      expect(result.withinLimits).toBe(true);
      expect(result.conversionsRemaining).toBe(3); // 5 - 2
      expect(result.apiCallsRemaining).toBe(5); // 10 - 5
    });

    it('should return not within limits when at capacity', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 5,
        apiCalls: 10,
      });

      const result = await checkDailyLimits('user-123', 'free');

      expect(result.withinLimits).toBe(false);
      expect(result.conversionsRemaining).toBe(0);
      expect(result.apiCallsRemaining).toBe(0);
    });

    it('should return not within limits when over capacity', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 100,
        apiCalls: 500,
      });

      const result = await checkDailyLimits('user-123', 'free');

      expect(result.withinLimits).toBe(false);
      expect(result.conversionsRemaining).toBe(0);
      expect(result.apiCallsRemaining).toBe(0);
    });

    it('should always be within limits for enterprise', async () => {
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 10000,
        apiCalls: 50000,
      });

      const result = await checkDailyLimits('user-123', 'enterprise');

      expect(result.withinLimits).toBe(true);
      expect(result.conversionsRemaining).toBe(Infinity);
      expect(result.apiCallsRemaining).toBe(Infinity);
    });

    it('should check both conversions and API calls', async () => {
      // Conversions at limit, API calls ok
      mockDailyUsageFindOneResult.mockResolvedValue({
        conversions: 5,
        apiCalls: 5,
      });

      const result = await checkDailyLimits('user-123', 'free');

      expect(result.withinLimits).toBe(false); // Conversions at 0
    });
  });
});

describe('Analytics Service - Event Count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTotalEventCount', () => {
    it('should return total event count for user', async () => {
      mockUsageEventCountDocuments.mockResolvedValue(150);

      const count = await getTotalEventCount('user-123');

      expect(count).toBe(150);
      expect(mockUsageEventCountDocuments).toHaveBeenCalledWith({ userId: 'user-123' });
    });

    it('should return 0 for new user', async () => {
      mockUsageEventCountDocuments.mockResolvedValue(0);

      const count = await getTotalEventCount('new-user');

      expect(count).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockUsageEventCountDocuments.mockRejectedValue(new Error('Database error'));

      const count = await getTotalEventCount('user-123');

      expect(count).toBe(0);
    });
  });
});

describe('Analytics Service - Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanupOldEvents', () => {
    it('should delete events older than 90 days', async () => {
      mockUsageEventDeleteMany.mockResolvedValue({ deletedCount: 100 });

      const deleted = await cleanupOldEvents();

      expect(deleted).toBe(100);
      expect(mockUsageEventDeleteMany).toHaveBeenCalled();
    });

    it('should return 0 if no events to delete', async () => {
      mockUsageEventDeleteMany.mockResolvedValue({ deletedCount: 0 });

      const deleted = await cleanupOldEvents();

      expect(deleted).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockUsageEventDeleteMany.mockRejectedValue(new Error('Delete error'));

      const deleted = await cleanupOldEvents();

      expect(deleted).toBe(0);
    });
  });
});

describe('Analytics Service - Plan Limits Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDailyUsageFindOneResult.mockResolvedValue({ conversions: 0, apiCalls: 0 });
    mockDailyUsageAggregate.mockResolvedValue([]);
  });

  describe('Plan-specific limits', () => {
    it('should enforce free plan limits', async () => {
      const summary = await getUsageSummary('user-123', 'free');

      expect(summary.limits.conversionsPerDay).toBe(5);
      expect(summary.limits.apiCallsPerDay).toBe(10);
    });

    it('should enforce pro plan limits', async () => {
      const summary = await getUsageSummary('user-123', 'pro');

      expect(summary.limits.conversionsPerDay).toBe(100);
      expect(summary.limits.apiCallsPerDay).toBe(500);
    });

    it('should enforce team plan limits', async () => {
      const summary = await getUsageSummary('user-123', 'team');

      expect(summary.limits.conversionsPerDay).toBe(500);
      expect(summary.limits.apiCallsPerDay).toBe(2000);
    });

    it('should handle enterprise unlimited limits', async () => {
      const summary = await getUsageSummary('user-123', 'enterprise');

      expect(summary.limits.conversionsPerDay).toBe(Infinity);
      expect(summary.limits.apiCallsPerDay).toBe(Infinity);
    });
  });
});
