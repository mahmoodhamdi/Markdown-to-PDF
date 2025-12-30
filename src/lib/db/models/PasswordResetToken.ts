/**
 * Password Reset Token Model
 * Stores password reset tokens for email-based password recovery
 */

import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';

export interface IPasswordResetToken {
  _id: string;
  userId: string; // User's email
  token: string; // Hashed token
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for cleanup of expired tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent model recompilation in development
export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

/**
 * Generate a secure random token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a password reset token for a user
 * @param userId The user's email
 * @param expiresInMinutes How long until the token expires (default: 60 minutes)
 * @returns The plain text token (to be sent in email) and the database document
 */
export async function createPasswordResetToken(
  userId: string,
  expiresInMinutes = 60
): Promise<{ token: string; doc: IPasswordResetToken }> {
  // Invalidate any existing tokens for this user
  await PasswordResetToken.updateMany(
    { userId, used: false },
    { $set: { used: true, usedAt: new Date() } }
  );

  // Generate new token
  const plainToken = generateResetToken();
  const hashedToken = hashToken(plainToken);

  const doc = await PasswordResetToken.create({
    userId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    used: false,
  });

  return { token: plainToken, doc: doc.toObject() };
}

/**
 * Verify a password reset token
 * @param token The plain text token from the email link
 * @returns The token document if valid, null otherwise
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<IPasswordResetToken | null> {
  const hashedToken = hashToken(token);

  const doc = await PasswordResetToken.findOne({
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
export async function markTokenAsUsed(token: string): Promise<void> {
  const hashedToken = hashToken(token);

  await PasswordResetToken.updateOne(
    { token: hashedToken },
    { $set: { used: true, usedAt: new Date() } }
  );
}

/**
 * Clean up expired tokens (called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await PasswordResetToken.deleteMany({
    expiresAt: { $lt: new Date() },
  });

  return result.deletedCount;
}

/**
 * Count recent password reset requests for rate limiting
 * @param userId The user's email
 * @param windowMinutes Time window to check (default: 60 minutes)
 * @returns Number of requests in the time window
 */
export async function countRecentResetRequests(
  userId: string,
  windowMinutes = 60
): Promise<number> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  return PasswordResetToken.countDocuments({
    userId,
    createdAt: { $gte: windowStart },
  });
}
