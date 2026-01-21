/**
 * Webhook Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  webhookLog,
  generateEventId,
} from '@/lib/webhooks/service';

// Mock MongoDB connection and model
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/WebhookEvent', () => ({
  WebhookEvent: {
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    aggregate: vi.fn().mockResolvedValue([]),
  },
}));

describe('Webhook Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('webhookLog', () => {
    it('should log info messages with correct prefix', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      webhookLog('info', 'Test info message', {
        gateway: 'stripe',
        eventId: 'evt_123',
        eventType: 'checkout.session.completed',
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Webhook]',
        'Test info message',
        expect.objectContaining({
          gateway: 'stripe',
          eventId: 'evt_123',
          eventType: 'checkout.session.completed',
          level: 'info',
          message: 'Test info message',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      webhookLog('warn', 'Test warning', {
        gateway: 'paddle',
        eventId: 'evt_456',
        eventType: 'subscription.past_due',
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Webhook]',
        'Test warning',
        expect.objectContaining({
          level: 'warn',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      webhookLog('error', 'Test error', {
        gateway: 'paymob',
        eventId: 'evt_789',
        eventType: 'payment.failed',
        error: 'Something went wrong',
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Webhook]',
        'Test error',
        expect.objectContaining({
          level: 'error',
          error: 'Something went wrong',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should include timestamp in log data', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      webhookLog('info', 'Test message', {
        gateway: 'stripe',
        eventId: 'evt_123',
        eventType: 'test',
      });

      const logCall = consoleSpy.mock.calls[0];
      const logData = logCall[2];
      expect(logData.timestamp).toBeDefined();
      expect(new Date(logData.timestamp).getTime()).toBeLessThanOrEqual(Date.now());

      consoleSpy.mockRestore();
    });
  });

  describe('generateEventId', () => {
    it('should generate unique event ID for stripe', () => {
      const eventId = generateEventId('stripe', 'txn_123', 'checkout.session.completed');

      expect(eventId).toContain('stripe');
      expect(eventId).toContain('txn_123');
      expect(eventId).toContain('checkout.session.completed');
    });

    it('should generate unique event ID for paddle', () => {
      const eventId = generateEventId('paddle', 'sub_456', 'subscription.created');

      expect(eventId).toContain('paddle');
      expect(eventId).toContain('sub_456');
      expect(eventId).toContain('subscription.created');
    });

    it('should generate unique event ID for paymob', () => {
      const eventId = generateEventId('paymob', '789', 'TRANSACTION');

      expect(eventId).toContain('paymob');
      expect(eventId).toContain('789');
      expect(eventId).toContain('TRANSACTION');
    });

    it('should generate unique event ID for paytabs', () => {
      const eventId = generateEventId('paytabs', 'TST_123', 'payment.success');

      expect(eventId).toContain('paytabs');
      expect(eventId).toContain('TST_123');
      expect(eventId).toContain('payment.success');
    });

    it('should include timestamp for uniqueness', () => {
      const before = Date.now();
      const eventId = generateEventId('stripe', 'txn_123', 'test');
      const after = Date.now();

      // Extract timestamp from event ID (last part after final colon)
      const parts = eventId.split(':');
      const timestamp = parseInt(parts[parts.length - 1]);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate different IDs for same input at different times', async () => {
      const eventId1 = generateEventId('stripe', 'txn_123', 'test');
      await new Promise(resolve => setTimeout(resolve, 5));
      const eventId2 = generateEventId('stripe', 'txn_123', 'test');

      expect(eventId1).not.toBe(eventId2);
    });
  });
});
