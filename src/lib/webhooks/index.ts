/**
 * Webhook Module
 * Exports for webhook handling utilities
 */

export {
  checkAndMarkProcessing,
  markProcessed,
  markFailed,
  markSkipped,
  webhookLog,
  generateEventId,
  getRecentEvents,
  getEventStats,
  type WebhookLogContext,
  type ProcessWebhookResult,
} from './service';

export {
  WebhookEvent,
  type IWebhookEvent,
  type WebhookGateway,
  type WebhookStatus,
} from '@/lib/db/models/WebhookEvent';
