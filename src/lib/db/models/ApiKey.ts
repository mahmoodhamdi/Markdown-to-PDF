/**
 * API Key Model
 * Stores API keys for programmatic access to the conversion API
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import crypto from 'crypto';

/**
 * API permissions
 */
export type ApiPermission = 'convert' | 'preview' | 'batch' | 'templates' | 'themes';

export const API_PERMISSIONS: ApiPermission[] = [
  'convert',
  'preview',
  'batch',
  'templates',
  'themes',
];

/**
 * API key limits by plan
 */
export const API_KEY_LIMITS = {
  free: { maxKeys: 1, rateLimit: 100, rateLimitWindow: 60 },
  pro: { maxKeys: 5, rateLimit: 500, rateLimitWindow: 60 },
  team: { maxKeys: 20, rateLimit: 2000, rateLimitWindow: 60 },
  enterprise: { maxKeys: 100, rateLimit: 10000, rateLimitWindow: 60 },
} as const;

export interface IApiKey {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: ApiPermission[];
  rateLimit: {
    limit: number;
    window: number;
  };
  lastUsedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiKeyDocument extends IApiKey, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IApiKeyModel extends Model<IApiKeyDocument> {
  generateKey(
    userId: string,
    name: string,
    permissions: ApiPermission[],
    options?: {
      expiresAt?: Date;
      rateLimit?: { limit: number; window: number };
    }
  ): Promise<{ apiKey: IApiKeyDocument; plainKey: string }>;
  verifyKey(key: string): Promise<IApiKeyDocument | null>;
  countUserKeys(userId: string): Promise<number>;
  getUserKeys(userId: string): Promise<IApiKeyDocument[]>;
  revokeKey(keyId: string, userId: string): Promise<boolean>;
}

const ApiKeySchema = new Schema<IApiKeyDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true },
    permissions: [
      {
        type: String,
        enum: API_PERMISSIONS,
      },
    ],
    rateLimit: {
      limit: { type: Number, default: 100 },
      window: { type: Number, default: 60 },
    },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
ApiKeySchema.index({ keyHash: 1 }, { unique: true });
ApiKeySchema.index({ userId: 1, revokedAt: 1 });
ApiKeySchema.index({ expiresAt: 1 }, { sparse: true });

/**
 * Generate a new API key
 * Returns the plain key only once - it should be shown to the user immediately
 */
ApiKeySchema.statics.generateKey = async function (
  userId: string,
  name: string,
  permissions: ApiPermission[],
  options?: {
    expiresAt?: Date;
    rateLimit?: { limit: number; window: number };
  }
): Promise<{ apiKey: IApiKeyDocument; plainKey: string }> {
  // Generate a secure random key with mk_ prefix (markdown-to-pdf key)
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const plainKey = `mk_${randomBytes}`;

  // Hash the key for storage (we never store the plain key)
  const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

  // Store the prefix for identification (mk_ + first 8 chars)
  const keyPrefix = plainKey.substring(0, 11);

  const apiKey = await this.create({
    userId,
    name: name.trim(),
    keyHash,
    keyPrefix,
    permissions,
    expiresAt: options?.expiresAt,
    rateLimit: options?.rateLimit || { limit: 100, window: 60 },
  });

  return { apiKey, plainKey };
};

/**
 * Verify an API key and update last used timestamp
 * Returns null if key is invalid, revoked, or expired
 */
ApiKeySchema.statics.verifyKey = async function (key: string): Promise<IApiKeyDocument | null> {
  // Validate key format
  if (!key || !key.startsWith('mk_') || key.length !== 67) {
    return null;
  }

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const apiKey = await this.findOneAndUpdate(
    {
      keyHash,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    },
    {
      $set: { lastUsedAt: new Date() },
    },
    { new: true }
  );

  return apiKey;
};

/**
 * Count the number of active API keys for a user
 */
ApiKeySchema.statics.countUserKeys = async function (userId: string): Promise<number> {
  return this.countDocuments({
    userId,
    revokedAt: null,
  });
};

/**
 * Get all API keys for a user (excluding revoked)
 */
ApiKeySchema.statics.getUserKeys = async function (userId: string): Promise<IApiKeyDocument[]> {
  return this.find({
    userId,
    revokedAt: null,
  }).sort({ createdAt: -1 });
};

/**
 * Revoke an API key
 * Returns true if key was revoked, false if not found or already revoked
 */
ApiKeySchema.statics.revokeKey = async function (keyId: string, userId: string): Promise<boolean> {
  const result = await this.findOneAndUpdate(
    {
      _id: keyId,
      userId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );

  return !!result;
};

// Prevent model recompilation in development
export const ApiKey: IApiKeyModel =
  (mongoose.models.ApiKey as IApiKeyModel) ||
  mongoose.model<IApiKeyDocument, IApiKeyModel>('ApiKey', ApiKeySchema);

/**
 * Helper function to hash an API key
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Check if user can create more API keys based on their plan
 */
export async function canCreateApiKey(
  userId: string,
  plan: 'free' | 'pro' | 'team' | 'enterprise'
): Promise<{ allowed: boolean; current: number; max: number }> {
  const current = await ApiKey.countUserKeys(userId);
  const max = API_KEY_LIMITS[plan].maxKeys;

  return {
    allowed: current < max,
    current,
    max,
  };
}

/**
 * Get the default rate limit for a plan
 */
export function getDefaultRateLimit(plan: 'free' | 'pro' | 'team' | 'enterprise'): {
  limit: number;
  window: number;
} {
  const limits = API_KEY_LIMITS[plan];
  return {
    limit: limits.rateLimit,
    window: limits.rateLimitWindow,
  };
}
