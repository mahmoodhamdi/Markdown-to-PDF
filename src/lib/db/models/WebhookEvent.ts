/**
 * WebhookEvent Model
 * Tracks processed webhook events for idempotency
 */

import mongoose, { Document, Schema } from 'mongoose';

export type WebhookGateway = 'stripe' | 'paymob' | 'paytabs' | 'paddle';
export type WebhookStatus = 'processing' | 'processed' | 'failed' | 'skipped';

export interface IWebhookEvent extends Document {
  eventId: string;
  gateway: WebhookGateway;
  eventType: string;
  payload?: Record<string, unknown>;
  processedAt: Date;
  status: WebhookStatus;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paymob', 'paytabs', 'paddle'],
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed', 'skipped'],
      default: 'processing',
    },
    error: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for event + gateway
webhookEventSchema.index({ eventId: 1, gateway: 1 }, { unique: true });

// TTL index - auto-delete after 30 days
webhookEventSchema.index(
  { processedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Index for querying by gateway and status
webhookEventSchema.index({ gateway: 1, status: 1 });

// Index for querying recent events
webhookEventSchema.index({ createdAt: -1 });

export const WebhookEvent =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
