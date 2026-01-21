/**
 * Login Attempt Model
 * Tracks failed login attempts for rate limiting and security
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ILoginAttempt {
  _id: string;
  identifier: string; // email or IP
  type: 'email' | 'ip';
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    identifier: { type: String, required: true, index: true },
    type: { type: String, enum: ['email', 'ip'], required: true },
    attempts: { type: Number, default: 0 },
    lastAttempt: { type: Date, default: Date.now },
    blockedUntil: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
LoginAttemptSchema.index({ identifier: 1, type: 1 }, { unique: true });

// TTL index to auto-delete old records after 24 hours
LoginAttemptSchema.index({ lastAttempt: 1 }, { expireAfterSeconds: 86400 });

// Prevent model recompilation in development
export const LoginAttempt: Model<ILoginAttempt> =
  mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);

// Constants for rate limiting
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(email: string, ip: string): Promise<void> {
  const now = new Date();

  // Update or create records for both email and IP
  await Promise.all([
    LoginAttempt.findOneAndUpdate(
      { identifier: email.toLowerCase(), type: 'email' },
      {
        $inc: { attempts: 1 },
        $set: { lastAttempt: now },
      },
      { upsert: true }
    ),
    LoginAttempt.findOneAndUpdate(
      { identifier: ip, type: 'ip' },
      {
        $inc: { attempts: 1 },
        $set: { lastAttempt: now },
      },
      { upsert: true }
    ),
  ]);
}

/**
 * Clear login attempts after successful login
 */
export async function clearLoginAttempts(email: string, ip: string): Promise<void> {
  await Promise.all([
    LoginAttempt.deleteOne({ identifier: email.toLowerCase(), type: 'email' }),
    LoginAttempt.deleteOne({ identifier: ip, type: 'ip' }),
  ]);
}

/**
 * Check if login is blocked due to too many attempts
 * Returns null if not blocked, or the remaining block time in seconds
 */
export async function checkLoginBlocked(
  email: string,
  ip: string
): Promise<{ blocked: boolean; remainingSeconds?: number; reason?: string }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

  const [emailRecord, ipRecord] = await Promise.all([
    LoginAttempt.findOne({
      identifier: email.toLowerCase(),
      type: 'email',
      lastAttempt: { $gte: windowStart },
    }),
    LoginAttempt.findOne({
      identifier: ip,
      type: 'ip',
      lastAttempt: { $gte: windowStart },
    }),
  ]);

  // Check if currently blocked
  if (emailRecord?.blockedUntil && emailRecord.blockedUntil > now) {
    const remainingSeconds = Math.ceil((emailRecord.blockedUntil.getTime() - now.getTime()) / 1000);
    return {
      blocked: true,
      remainingSeconds,
      reason: 'Too many failed login attempts for this email',
    };
  }

  if (ipRecord?.blockedUntil && ipRecord.blockedUntil > now) {
    const remainingSeconds = Math.ceil((ipRecord.blockedUntil.getTime() - now.getTime()) / 1000);
    return {
      blocked: true,
      remainingSeconds,
      reason: 'Too many failed login attempts from this IP',
    };
  }

  // Check if should be blocked (reached max attempts)
  if (emailRecord && emailRecord.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
    await LoginAttempt.updateOne({ _id: emailRecord._id }, { $set: { blockedUntil } });
    return {
      blocked: true,
      remainingSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      reason: 'Too many failed login attempts. Please try again later.',
    };
  }

  if (ipRecord && ipRecord.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
    await LoginAttempt.updateOne({ _id: ipRecord._id }, { $set: { blockedUntil } });
    return {
      blocked: true,
      remainingSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      reason: 'Too many failed login attempts. Please try again later.',
    };
  }

  return { blocked: false };
}

/**
 * Get remaining attempts before block
 */
export async function getRemainingAttempts(email: string, ip: string): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

  const [emailRecord, ipRecord] = await Promise.all([
    LoginAttempt.findOne({
      identifier: email.toLowerCase(),
      type: 'email',
      lastAttempt: { $gte: windowStart },
    }),
    LoginAttempt.findOne({
      identifier: ip,
      type: 'ip',
      lastAttempt: { $gte: windowStart },
    }),
  ]);

  const emailAttempts = emailRecord?.attempts || 0;
  const ipAttempts = ipRecord?.attempts || 0;
  const maxAttempts = Math.max(emailAttempts, ipAttempts);

  return Math.max(0, MAX_ATTEMPTS - maxAttempts);
}
