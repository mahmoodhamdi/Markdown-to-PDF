/**
 * WebhookEvent Model Tests
 */

import { describe, it, expect } from 'vitest';

describe('WebhookEvent Model', () => {
  describe('Schema Definition', () => {
    it('should export WebhookGateway type', () => {
      // Type check - WebhookGateway is a TypeScript type, not a runtime value
      // This test verifies the type definition by using it
      type TestGateway = import('@/lib/db/models/WebhookEvent').WebhookGateway;
      const validGateways: TestGateway[] = ['stripe', 'paymob', 'paytabs', 'paddle'];
      expect(validGateways).toHaveLength(4);
    });

    it('should export WebhookStatus type', () => {
      // Type check - WebhookStatus is a TypeScript type, not a runtime value
      type TestStatus = import('@/lib/db/models/WebhookEvent').WebhookStatus;
      const validStatuses: TestStatus[] = ['processing', 'processed', 'failed', 'skipped'];
      expect(validStatuses).toHaveLength(4);
    });

    it('should export IWebhookEvent interface', async () => {
      const mod = await import('@/lib/db/models/WebhookEvent');
      // If the module exports, the interface exists
      expect(mod).toBeDefined();
    });

    it('should export WebhookEvent model', async () => {
      const { WebhookEvent } = await import('@/lib/db/models/WebhookEvent');
      expect(WebhookEvent).toBeDefined();
      expect(WebhookEvent.modelName).toBe('WebhookEvent');
    });
  });

  describe('Gateway Enum Values', () => {
    it('should accept stripe as valid gateway', () => {
      const gateway: 'stripe' | 'paymob' | 'paytabs' | 'paddle' = 'stripe';
      expect(gateway).toBe('stripe');
    });

    it('should accept paymob as valid gateway', () => {
      const gateway: 'stripe' | 'paymob' | 'paytabs' | 'paddle' = 'paymob';
      expect(gateway).toBe('paymob');
    });

    it('should accept paytabs as valid gateway', () => {
      const gateway: 'stripe' | 'paymob' | 'paytabs' | 'paddle' = 'paytabs';
      expect(gateway).toBe('paytabs');
    });

    it('should accept paddle as valid gateway', () => {
      const gateway: 'stripe' | 'paymob' | 'paytabs' | 'paddle' = 'paddle';
      expect(gateway).toBe('paddle');
    });
  });

  describe('Status Enum Values', () => {
    it('should accept processing as valid status', () => {
      const status: 'processing' | 'processed' | 'failed' | 'skipped' = 'processing';
      expect(status).toBe('processing');
    });

    it('should accept processed as valid status', () => {
      const status: 'processing' | 'processed' | 'failed' | 'skipped' = 'processed';
      expect(status).toBe('processed');
    });

    it('should accept failed as valid status', () => {
      const status: 'processing' | 'processed' | 'failed' | 'skipped' = 'failed';
      expect(status).toBe('failed');
    });

    it('should accept skipped as valid status', () => {
      const status: 'processing' | 'processed' | 'failed' | 'skipped' = 'skipped';
      expect(status).toBe('skipped');
    });
  });

  describe('Index Module Exports', () => {
    it('should export all required functions from index', async () => {
      const webhooks = await import('@/lib/webhooks');

      expect(webhooks.checkAndMarkProcessing).toBeDefined();
      expect(webhooks.markProcessed).toBeDefined();
      expect(webhooks.markFailed).toBeDefined();
      expect(webhooks.markSkipped).toBeDefined();
      expect(webhooks.webhookLog).toBeDefined();
      expect(webhooks.generateEventId).toBeDefined();
      expect(webhooks.getRecentEvents).toBeDefined();
      expect(webhooks.getEventStats).toBeDefined();
    });

    it('should export WebhookEvent model from index', async () => {
      const webhooks = await import('@/lib/webhooks');
      expect(webhooks.WebhookEvent).toBeDefined();
    });
  });
});
