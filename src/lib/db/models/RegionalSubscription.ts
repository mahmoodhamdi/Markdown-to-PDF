/**
 * Regional Subscription Model
 * Stores subscription data for regional payment gateways (Paymob, PayTabs)
 * These gateways don't have native subscription support, so we manage it ourselves
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import { PlanType } from '@/lib/plans/config';

export type RegionalGateway = 'paymob' | 'paytabs';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';
export type BillingInterval = 'monthly' | 'yearly';

export interface IRegionalSubscriptionBase {
  userId: string;
  gateway: RegionalGateway;
  gatewayTransactionId: string;
  gatewayCustomerId?: string;
  plan: PlanType;
  billing: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  lastPaymentAt?: Date;
  lastPaymentAmount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Document type with mongoose methods
export interface IRegionalSubscription extends IRegionalSubscriptionBase, Document {
  isActive(): boolean;
  cancel(immediate?: boolean): Promise<void>;
  renew(transactionId: string, amount: number, currency: string): Promise<void>;
}

const RegionalSubscriptionSchema = new Schema<IRegionalSubscription>(
  {
    userId: { type: String, required: true, index: true },
    gateway: {
      type: String,
      enum: ['paymob', 'paytabs'],
      required: true,
    },
    gatewayTransactionId: { type: String, required: true },
    gatewayCustomerId: { type: String },
    plan: {
      type: String,
      enum: ['free', 'pro', 'team', 'enterprise'],
      required: true,
    },
    billing: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'expired'],
      default: 'active',
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    lastPaymentAt: { type: Date },
    lastPaymentAmount: { type: Number },
    currency: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
RegionalSubscriptionSchema.index({ gateway: 1, gatewayTransactionId: 1 }, { unique: true });
RegionalSubscriptionSchema.index({ userId: 1, gateway: 1 });
RegionalSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Static methods for common operations
RegionalSubscriptionSchema.statics.findByUserId = function (
  userId: string,
  gateway?: RegionalGateway
) {
  const query: Record<string, unknown> = { userId };
  if (gateway) {
    query.gateway = gateway;
  }
  return this.findOne(query).sort({ createdAt: -1 });
};

RegionalSubscriptionSchema.statics.findByTransactionId = function (
  gateway: RegionalGateway,
  transactionId: string
) {
  return this.findOne({ gateway, gatewayTransactionId: transactionId });
};

RegionalSubscriptionSchema.statics.findActiveByUserId = function (
  userId: string,
  gateway?: RegionalGateway
) {
  const query: Record<string, unknown> = {
    userId,
    status: 'active',
    currentPeriodEnd: { $gt: new Date() },
  };
  if (gateway) {
    query.gateway = gateway;
  }
  return this.findOne(query);
};

// Instance methods
RegionalSubscriptionSchema.methods.isActive = function (): boolean {
  return this.status === 'active' && new Date() < this.currentPeriodEnd;
};

RegionalSubscriptionSchema.methods.cancel = async function (immediate = false): Promise<void> {
  if (immediate) {
    this.status = 'canceled';
    this.canceledAt = new Date();
  } else {
    this.cancelAtPeriodEnd = true;
  }
  await this.save();
};

RegionalSubscriptionSchema.methods.renew = async function (
  transactionId: string,
  amount: number,
  currency: string
): Promise<void> {
  const periodDays = this.billing === 'yearly' ? 365 : 30;
  this.currentPeriodStart = new Date();
  this.currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
  this.status = 'active';
  this.cancelAtPeriodEnd = false;
  this.lastPaymentAt = new Date();
  this.lastPaymentAmount = amount;
  this.currency = currency;
  this.gatewayTransactionId = transactionId;
  await this.save();
};

// Type for model with static methods
interface RegionalSubscriptionModel extends Model<IRegionalSubscription> {
  findByUserId(userId: string, gateway?: RegionalGateway): Promise<IRegionalSubscription | null>;
  findByTransactionId(
    gateway: RegionalGateway,
    transactionId: string
  ): Promise<IRegionalSubscription | null>;
  findActiveByUserId(
    userId: string,
    gateway?: RegionalGateway
  ): Promise<IRegionalSubscription | null>;
}

// Prevent model recompilation in development
export const RegionalSubscription: RegionalSubscriptionModel =
  (mongoose.models.RegionalSubscription as unknown as RegionalSubscriptionModel) ||
  mongoose.model<IRegionalSubscription, RegionalSubscriptionModel>(
    'RegionalSubscription',
    RegionalSubscriptionSchema
  );

/**
 * Helper to create a new subscription
 */
export async function createRegionalSubscription(data: {
  userId: string;
  gateway: RegionalGateway;
  gatewayTransactionId: string;
  gatewayCustomerId?: string;
  plan: PlanType;
  billing?: BillingInterval;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<IRegionalSubscription> {
  const periodDays = data.billing === 'yearly' ? 365 : 30;
  const now = new Date();

  const subscription = new RegionalSubscription({
    userId: data.userId,
    gateway: data.gateway,
    gatewayTransactionId: data.gatewayTransactionId,
    gatewayCustomerId: data.gatewayCustomerId,
    plan: data.plan,
    billing: data.billing || 'monthly',
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    lastPaymentAt: now,
    lastPaymentAmount: data.amount,
    currency: data.currency,
    metadata: data.metadata,
  });

  await subscription.save();
  return subscription;
}

/**
 * Helper to update subscription from webhook
 */
export async function updateSubscriptionFromWebhook(
  gateway: RegionalGateway,
  transactionId: string,
  data: {
    status?: SubscriptionStatus;
    amount?: number;
    currency?: string;
    plan?: PlanType;
  }
): Promise<IRegionalSubscription | null> {
  const subscription = await RegionalSubscription.findByTransactionId(gateway, transactionId);

  if (!subscription) {
    return null;
  }

  if (data.status) {
    subscription.status = data.status;
    if (data.status === 'canceled') {
      subscription.canceledAt = new Date();
    }
  }

  if (data.amount !== undefined) {
    subscription.lastPaymentAmount = data.amount;
    subscription.lastPaymentAt = new Date();
  }

  if (data.currency) {
    subscription.currency = data.currency;
  }

  if (data.plan) {
    subscription.plan = data.plan;
  }

  await subscription.save();
  return subscription;
}

/**
 * Check and expire subscriptions past their period end
 */
export async function expireOverdueSubscriptions(): Promise<number> {
  const result = await RegionalSubscription.updateMany(
    {
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: { $lt: new Date() },
    },
    {
      $set: {
        status: 'expired',
      },
    }
  );

  return result.modifiedCount;
}
