/**
 * Email Verification Token Model
 * Stores email verification tokens for new user signup
 */

import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';

export interface IEmailVerificationToken {
  _id: string;
  userId: string; // User's email
  token: string; // Hashed token
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
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
EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent model recompilation in development
export const EmailVerificationToken: Model<IEmailVerificationToken> =
  mongoose.models.EmailVerificationToken ||
  mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema);

/**
 * Generate a secure random token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create an email verification token for a user
 * @param userId The user's email
 * @param expiresInHours How long until the token expires (default: 24 hours)
 * @returns The plain text token (to be sent in email) and the database document
 */
export async function createEmailVerificationToken(
  userId: string,
  expiresInHours = 24
): Promise<{ token: string; doc: IEmailVerificationToken }> {
  // Invalidate any existing tokens for this user
  await EmailVerificationToken.updateMany(
    { userId, used: false },
    { $set: { used: true, usedAt: new Date() } }
  );

  // Generate new token
  const plainToken = generateVerificationToken();
  const hashedToken = hashVerificationToken(plainToken);

  const doc = await EmailVerificationToken.create({
    userId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    used: false,
  });

  return { token: plainToken, doc: doc.toObject() };
}

/**
 * Verify an email verification token
 * @param token The plain text token from the email link
 * @returns The token document if valid, null otherwise
 */
export async function verifyEmailVerificationToken(
  token: string
): Promise<IEmailVerificationToken | null> {
  const hashedToken = hashVerificationToken(token);

  const doc = await EmailVerificationToken.findOne({
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
export async function markVerificationTokenAsUsed(token: string): Promise<void> {
  const hashedToken = hashVerificationToken(token);

  await EmailVerificationToken.updateOne(
    { token: hashedToken },
    { $set: { used: true, usedAt: new Date() } }
  );
}

/**
 * Check if user has a pending verification token
 * @param userId The user's email
 * @returns True if there's a valid pending token
 */
export async function hasPendingVerification(userId: string): Promise<boolean> {
  const doc = await EmailVerificationToken.findOne({
    userId,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  return !!doc;
}

/**
 * Count recent verification requests for rate limiting
 * @param userId The user's email
 * @param windowMinutes Time window to check (default: 60 minutes)
 * @returns Number of requests in the time window
 */
export async function countRecentVerificationRequests(
  userId: string,
  windowMinutes = 60
): Promise<number> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  return EmailVerificationToken.countDocuments({
    userId,
    createdAt: { $gte: windowStart },
  });
}
