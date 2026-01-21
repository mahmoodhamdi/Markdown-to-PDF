/**
 * Usage Models
 * Tracks user activity and usage metrics
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type EventType =
  | 'conversion'
  | 'api_call'
  | 'file_upload'
  | 'file_download'
  | 'template_used'
  | 'batch_conversion';

// Usage Event Model
export interface IUsageEvent extends Document {
  userId: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  date: string; // YYYY-MM-DD for daily aggregation
}

const UsageEventSchema = new Schema<IUsageEvent>(
  {
    userId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'conversion',
        'api_call',
        'file_upload',
        'file_download',
        'template_used',
        'batch_conversion',
      ],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    date: { type: String, required: true, index: true },
  },
  {
    timestamps: false,
  }
);

// Indexes (userId and date indexes already created by index: true in schema)
UsageEventSchema.index({ userId: 1, date: 1 }); // Compound index for daily queries
UsageEventSchema.index({ userId: 1, eventType: 1, date: 1 }); // For filtered analytics

export const UsageEvent: Model<IUsageEvent> =
  mongoose.models.UsageEvent || mongoose.model<IUsageEvent>('UsageEvent', UsageEventSchema);

// Daily Usage Model
export interface IDailyUsage extends Document {
  userId: string;
  date: string;
  conversions: number;
  apiCalls: number;
  fileUploads: number;
  fileDownloads: number;
  templatesUsed: number;
  batchConversions: number;
  storageUsed: number;
}

const DailyUsageSchema = new Schema<IDailyUsage>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    conversions: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    fileUploads: { type: Number, default: 0 },
    fileDownloads: { type: Number, default: 0 },
    templatesUsed: { type: Number, default: 0 },
    batchConversions: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
DailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyUsage: Model<IDailyUsage> =
  mongoose.models.DailyUsage || mongoose.model<IDailyUsage>('DailyUsage', DailyUsageSchema);
