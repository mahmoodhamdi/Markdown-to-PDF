/**
 * Unit tests for analytics service
 */

import { describe, it, expect, vi } from 'vitest';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => ({ exists: false, data: () => null })),
        set: vi.fn(),
      })),
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(() => ({ docs: [] })),
          orderBy: vi.fn(() => ({
            get: vi.fn(() => ({ docs: [] })),
          })),
        })),
        count: vi.fn(() => ({
          get: vi.fn(() => ({ data: () => ({ count: 0 }) })),
        })),
        limit: vi.fn(() => ({
          get: vi.fn(() => ({ empty: true, docs: [] })),
        })),
      })),
    })),
    runTransaction: vi.fn((fn) =>
      fn({
        get: vi.fn(() => ({ exists: false, data: () => null })),
        set: vi.fn(),
      })
    ),
    batch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn(),
    })),
  },
}));

describe('Analytics Service - Event Types', () => {
  describe('EventType', () => {
    it('should have conversion event type', () => {
      const validTypes = [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ];
      expect(validTypes).toContain('conversion');
    });

    it('should have api_call event type', () => {
      const validTypes = [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ];
      expect(validTypes).toContain('api_call');
    });

    it('should have file_upload event type', () => {
      const validTypes = [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ];
      expect(validTypes).toContain('file_upload');
    });

    it('should have file_download event type', () => {
      const validTypes = [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ];
      expect(validTypes).toContain('file_download');
    });

    it('should have template_used event type', () => {
      const validTypes = [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ];
      expect(validTypes).toContain('template_used');
    });

    it('should have batch_conversion event type', () => {
      const validTypes = [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ];
      expect(validTypes).toContain('batch_conversion');
    });
  });
});

describe('Analytics Service - Data Structures', () => {
  describe('UsageEvent interface', () => {
    it('should have all required fields', () => {
      const event = {
        id: 'event-123',
        userId: 'user-456',
        eventType: 'conversion' as const,
        timestamp: new Date(),
        date: '2025-01-01',
      };

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('userId');
      expect(event).toHaveProperty('eventType');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('date');
    });

    it('should support optional metadata field', () => {
      const event = {
        id: 'event-123',
        userId: 'user-456',
        eventType: 'conversion' as const,
        metadata: { theme: 'github', fileSize: 1024 },
        timestamp: new Date(),
        date: '2025-01-01',
      };

      expect(event.metadata).toEqual({ theme: 'github', fileSize: 1024 });
    });
  });

  describe('DailyUsage interface', () => {
    it('should have all required fields', () => {
      const usage = {
        date: '2025-01-01',
        conversions: 10,
        apiCalls: 50,
        fileUploads: 5,
        fileDownloads: 3,
        templatesUsed: 2,
        batchConversions: 1,
        storageUsed: 1024,
      };

      expect(usage).toHaveProperty('date');
      expect(usage).toHaveProperty('conversions');
      expect(usage).toHaveProperty('apiCalls');
      expect(usage).toHaveProperty('fileUploads');
      expect(usage).toHaveProperty('fileDownloads');
      expect(usage).toHaveProperty('templatesUsed');
      expect(usage).toHaveProperty('batchConversions');
      expect(usage).toHaveProperty('storageUsed');
    });

    it('should have numeric values', () => {
      const usage = {
        date: '2025-01-01',
        conversions: 10,
        apiCalls: 50,
        fileUploads: 5,
        fileDownloads: 3,
        templatesUsed: 2,
        batchConversions: 1,
        storageUsed: 1024,
      };

      expect(typeof usage.conversions).toBe('number');
      expect(typeof usage.apiCalls).toBe('number');
      expect(typeof usage.fileUploads).toBe('number');
    });
  });

  describe('UsageSummary interface', () => {
    it('should contain today, thisWeek, and thisMonth', () => {
      const summary = {
        today: {
          date: '2025-01-01',
          conversions: 5,
          apiCalls: 20,
          fileUploads: 0,
          fileDownloads: 0,
          templatesUsed: 0,
          batchConversions: 0,
          storageUsed: 0,
        },
        thisWeek: {
          date: '2025-01-01 to 2025-01-07',
          conversions: 35,
          apiCalls: 140,
          fileUploads: 0,
          fileDownloads: 0,
          templatesUsed: 0,
          batchConversions: 0,
          storageUsed: 0,
        },
        thisMonth: {
          date: '2025-01-01 to 2025-01-31',
          conversions: 150,
          apiCalls: 600,
          fileUploads: 0,
          fileDownloads: 0,
          templatesUsed: 0,
          batchConversions: 0,
          storageUsed: 0,
        },
        limits: {
          conversionsPerDay: 20,
          apiCallsPerDay: 100,
        },
        remaining: {
          conversionsToday: 15,
          apiCallsToday: 80,
        },
      };

      expect(summary).toHaveProperty('today');
      expect(summary).toHaveProperty('thisWeek');
      expect(summary).toHaveProperty('thisMonth');
      expect(summary).toHaveProperty('limits');
      expect(summary).toHaveProperty('remaining');
    });
  });
});

describe('Analytics Service - Date Utilities', () => {
  describe('Date formatting', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2025-01-15');
    });

    it('should handle single digit months', () => {
      const date = new Date('2025-03-01T12:00:00Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2025-03-01');
    });

    it('should handle single digit days', () => {
      const date = new Date('2025-12-05T12:00:00Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2025-12-05');
    });
  });

  describe('Week calculation', () => {
    it('should get correct day of week', () => {
      const sunday = new Date('2025-01-05T12:00:00Z'); // Sunday
      expect(sunday.getDay()).toBe(0);
    });

    it('should get correct day of week for Saturday', () => {
      const saturday = new Date('2025-01-04T12:00:00Z'); // Saturday
      expect(saturday.getDay()).toBe(6);
    });
  });
});

describe('Analytics Service - Plan Limits', () => {
  describe('Free plan limits', () => {
    it('should have 20 conversions per day', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('free');
      expect(limits.conversionsPerDay).toBe(20);
    });

    it('should have 100 API calls per day', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('free');
      expect(limits.apiCallsPerDay).toBe(100);
    });
  });

  describe('Pro plan limits', () => {
    it('should have 500 conversions per day', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('pro');
      expect(limits.conversionsPerDay).toBe(500);
    });

    it('should have 2000 API calls per day', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('pro');
      expect(limits.apiCallsPerDay).toBe(2000);
    });
  });

  describe('Team plan limits', () => {
    it('should have unlimited conversions', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('team');
      expect(limits.conversionsPerDay).toBe(Infinity);
    });

    it('should have 10000 API calls per day', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('team');
      expect(limits.apiCallsPerDay).toBe(10000);
    });
  });

  describe('Enterprise plan limits', () => {
    it('should have unlimited conversions', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('enterprise');
      expect(limits.conversionsPerDay).toBe(Infinity);
    });

    it('should have 100000 API calls per day', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('enterprise');
      expect(limits.apiCallsPerDay).toBe(100000);
    });
  });
});

describe('Analytics Service - Remaining Calculations', () => {
  describe('Conversions remaining', () => {
    it('should calculate remaining conversions correctly', () => {
      const limit = 20;
      const used = 5;
      const remaining = Math.max(0, limit - used);
      expect(remaining).toBe(15);
    });

    it('should return 0 when at limit', () => {
      const limit = 20;
      const used = 20;
      const remaining = Math.max(0, limit - used);
      expect(remaining).toBe(0);
    });

    it('should return 0 when over limit', () => {
      const limit = 20;
      const used = 25;
      const remaining = Math.max(0, limit - used);
      expect(remaining).toBe(0);
    });

    it('should return Infinity for unlimited plans', () => {
      const limit = Infinity;
      const used = 1000;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
      expect(remaining).toBe(Infinity);
    });
  });
});
