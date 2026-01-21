/**
 * Webhook Service
 * Provides idempotency checking and structured logging for webhook handlers
 */

import { connectDB } from '@/lib/db/mongodb';
import {
  WebhookEvent,
  WebhookGateway,
  WebhookStatus,
  IWebhookEvent,
} from '@/lib/db/models/WebhookEvent';

export interface WebhookLogContext {
  gateway: WebhookGateway;
  eventId: string;
  eventType: string;
  [key: string]: unknown;
}

export interface ProcessWebhookResult {
  isNew: boolean;
  event?: IWebhookEvent;
  status: 'new' | 'duplicate' | 'error';
  error?: string;
}

/**
 * Check if a webhook event has already been processed (idempotency check)
 * Also marks the event as 'processing' if it's new
 */
export async function checkAndMarkProcessing(
  gateway: WebhookGateway,
  eventId: string,
  eventType: string,
  payload?: Record<string, unknown>
): Promise<ProcessWebhookResult> {
  try {
    await connectDB();

    // Try to find existing event
    const existingEvent = await WebhookEvent.findOne({
      eventId,
      gateway,
    });

    if (existingEvent) {
      webhookLog('info', 'Duplicate webhook event, skipping', {
        gateway,
        eventId,
        eventType,
        originalStatus: existingEvent.status,
        originalProcessedAt: existingEvent.processedAt,
      });

      return {
        isNew: false,
        event: existingEvent,
        status: 'duplicate',
      };
    }

    // Create new event record with 'processing' status
    const newEvent = await WebhookEvent.create({
      eventId,
      gateway,
      eventType,
      payload,
      status: 'processing',
      processedAt: new Date(),
    });

    return {
      isNew: true,
      event: newEvent,
      status: 'new',
    };
  } catch (error) {
    // Handle duplicate key error (race condition)
    if ((error as { code?: number }).code === 11000) {
      webhookLog('info', 'Duplicate webhook event (race condition), skipping', {
        gateway,
        eventId,
        eventType,
      });

      return {
        isNew: false,
        status: 'duplicate',
      };
    }

    webhookLog('error', 'Error checking webhook idempotency', {
      gateway,
      eventId,
      eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      isNew: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark a webhook event as processed successfully
 */
export async function markProcessed(
  gateway: WebhookGateway,
  eventId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await WebhookEvent.findOneAndUpdate(
      { eventId, gateway },
      {
        $set: {
          status: 'processed' as WebhookStatus,
          processedAt: new Date(),
          ...(metadata && { metadata }),
        },
      }
    );
  } catch (error) {
    webhookLog('error', 'Error marking webhook as processed', {
      gateway,
      eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Mark a webhook event as failed
 */
export async function markFailed(
  gateway: WebhookGateway,
  eventId: string,
  errorMessage: string
): Promise<void> {
  try {
    await WebhookEvent.findOneAndUpdate(
      { eventId, gateway },
      {
        $set: {
          status: 'failed' as WebhookStatus,
          error: errorMessage,
        },
      }
    );
  } catch (error) {
    webhookLog('error', 'Error marking webhook as failed', {
      gateway,
      eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Mark a webhook event as skipped (e.g., unhandled event type)
 */
export async function markSkipped(
  gateway: WebhookGateway,
  eventId: string,
  reason?: string
): Promise<void> {
  try {
    await WebhookEvent.findOneAndUpdate(
      { eventId, gateway },
      {
        $set: {
          status: 'skipped' as WebhookStatus,
          ...(reason && { error: reason }),
        },
      }
    );
  } catch (error) {
    webhookLog('error', 'Error marking webhook as skipped', {
      gateway,
      eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Structured webhook logging
 */
export function webhookLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: WebhookLogContext | Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context,
  };

  const prefix = `[Webhook]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, logData);
      break;
    case 'warn':
      console.warn(prefix, message, logData);
      break;
    default:
      console.log(prefix, message, logData);
  }
}

/**
 * Helper to generate a unique event ID for gateways that don't provide one
 */
export function generateEventId(
  gateway: WebhookGateway,
  transactionId: string,
  eventType: string
): string {
  return `${gateway}:${transactionId}:${eventType}:${Date.now()}`;
}

/**
 * Get recent webhook events for monitoring
 */
export async function getRecentEvents(
  gateway?: WebhookGateway,
  limit: number = 100
): Promise<IWebhookEvent[]> {
  await connectDB();

  const query = gateway ? { gateway } : {};
  return WebhookEvent.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

/**
 * Get webhook event statistics
 */
export async function getEventStats(
  gateway?: WebhookGateway,
  hours: number = 24
): Promise<{
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  byType: Record<string, number>;
}> {
  await connectDB();

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const matchQuery: Record<string, unknown> = { createdAt: { $gte: since } };
  if (gateway) {
    matchQuery.gateway = gateway;
  }

  const stats = await WebhookEvent.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const typeStats = await WebhookEvent.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
    byType: {} as Record<string, number>,
  };

  for (const stat of stats) {
    result[stat._id as keyof typeof result] = stat.count;
    result.total += stat.count;
  }

  for (const stat of typeStats) {
    result.byType[stat._id] = stat.count;
  }

  return result;
}
