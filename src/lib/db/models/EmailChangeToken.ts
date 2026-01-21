/**
 * Email Change Token Model
 * Stores tokens for email change verification
 */

import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';

export interface IEmailChangeToken {
  _id: string;
  userId: string; // User's current email (same as User._id)
  oldEmail: string; // Current email
  newEmail: string; // New email to change to
  token: string; // Hashed token
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const EmailChangeTokenSchema = new Schema<IEmailChangeToken>(
  {
    userId: { type: String, required: true, index: true },
    oldEmail: { type: String, required: true },
    newEmail: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for cleanup of expired tokens (TTL index)
EmailChangeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent model recompilation in development
export const EmailChangeToken: Model<IEmailChangeToken> =
  mongoose.models.EmailChangeToken ||
  mongoose.model<IEmailChangeToken>('EmailChangeToken', EmailChangeTokenSchema);

/**
 * Generate a secure random token
 */
export function generateEmailChangeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashEmailToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create an email change token for a user
 * @param userId The user's current email (ID)
 * @param oldEmail The user's current email
 * @param newEmail The new email to change to
 * @param expiresInMinutes How long until the token expires (default: 60 minutes)
 * @returns The plain text token (to be sent in email) and the database document
 */
export async function createEmailChangeToken(
  userId: string,
  oldEmail: string,
  newEmail: string,
  expiresInMinutes = 60
): Promise<{ token: string; doc: IEmailChangeToken }> {
  // Invalidate any existing tokens for this user
  await EmailChangeToken.updateMany(
    { userId, used: false },
    { $set: { used: true, usedAt: new Date() } }
  );

  // Generate new token
  const plainToken = generateEmailChangeToken();
  const hashedToken = hashEmailToken(plainToken);

  const doc = await EmailChangeToken.create({
    userId,
    oldEmail,
    newEmail,
    token: hashedToken,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    used: false,
  });

  return { token: plainToken, doc: doc.toObject() };
}

/**
 * Verify an email change token
 * @param token The plain text token from the email link
 * @returns The token document if valid, null otherwise
 */
export async function verifyEmailChangeToken(token: string): Promise<IEmailChangeToken | null> {
  const hashedToken = hashEmailToken(token);

  const doc = await EmailChangeToken.findOne({
    token: hashedToken,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  return doc ? doc.toObject() : null;
}

/**
 * Mark a token as used
 * @param token The plain text token
 */
export async function markEmailTokenAsUsed(token: string): Promise<void> {
  const hashedToken = hashEmailToken(token);

  await EmailChangeToken.updateOne(
    { token: hashedToken },
    { $set: { used: true, usedAt: new Date() } }
  );
}

/**
 * Clean up expired tokens (called periodically)
 */
export async function cleanupExpiredEmailTokens(): Promise<number> {
  const result = await EmailChangeToken.deleteMany({
    expiresAt: { $lt: new Date() },
  });

  return result.deletedCount;
}

/**
 * Count recent email change requests for rate limiting
 * @param userId The user's email
 * @param windowMinutes Time window to check (default: 60 minutes)
 * @returns Number of requests in the time window
 */
export async function countRecentEmailChangeRequests(
  userId: string,
  windowMinutes = 60
): Promise<number> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  return EmailChangeToken.countDocuments({
    userId,
    createdAt: { $gte: windowStart },
  });
}

/**
 * Check if an email is already pending change for another user
 * @param newEmail The email to check
 * @returns true if the email has a pending change request
 */
export async function isEmailPendingChange(newEmail: string): Promise<boolean> {
  const count = await EmailChangeToken.countDocuments({
    newEmail,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  return count > 0;
}
