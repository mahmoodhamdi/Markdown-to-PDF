/**
 * Session Service
 * Manages user sessions for the security settings
 */

import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db/mongodb';
import { Session, type ISession } from '@/lib/db/models';
import crypto from 'crypto';

// Parse user agent to extract browser, OS, and device info
export function parseUserAgent(userAgent?: string): {
  browser: string;
  os: string;
  device: string;
} {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  }

  // Extract browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg/')) {
    browser = 'Microsoft Edge';
  } else if (userAgent.includes('Chrome/')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera';
  }

  // Extract OS
  let os = 'Unknown';
  if (userAgent.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Extract device type
  let device = 'Desktop';
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    device = 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}

// Hash token for storage
function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Create or update a session
export async function createSession(
  userId: string,
  token: string,
  userAgent?: string,
  ip?: string
): Promise<ISession> {
  await connectDB();

  const hashedToken = hashSessionToken(token);
  const { browser, os, device } = parseUserAgent(userAgent);

  // Check if session with this token already exists
  let session = await Session.findOne({ token: hashedToken });

  if (session) {
    // Update last active time
    session.lastActive = new Date();
    await session.save();
    return session.toObject();
  }

  // Create new session
  const sessionId = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  session = new Session({
    _id: sessionId,
    userId,
    token: hashedToken,
    userAgent,
    browser,
    os,
    device,
    ip,
    lastActive: new Date(),
    expiresAt,
  });

  await session.save();
  return session.toObject();
}

// Update session last active time
export async function updateSessionActivity(token: string): Promise<void> {
  await connectDB();

  const hashedToken = hashSessionToken(token);
  await Session.updateOne(
    { token: hashedToken },
    { lastActive: new Date() }
  );
}

// Get all sessions for a user
export async function getUserSessions(userId: string): Promise<ISession[]> {
  await connectDB();

  const sessions = await Session.find({ userId })
    .sort({ lastActive: -1 })
    .lean();

  return sessions;
}

// Revoke a specific session
export async function revokeSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  await connectDB();

  const result = await Session.deleteOne({
    _id: sessionId,
    userId, // Ensure user can only revoke their own sessions
  });

  return result.deletedCount > 0;
}

// Revoke all sessions except current
export async function revokeOtherSessions(
  userId: string,
  currentToken: string
): Promise<number> {
  await connectDB();

  const hashedToken = hashSessionToken(currentToken);

  const result = await Session.deleteMany({
    userId,
    token: { $ne: hashedToken },
  });

  return result.deletedCount;
}

// Check if current token matches a session
export async function isCurrentSession(
  sessionId: string,
  currentToken: string
): Promise<boolean> {
  await connectDB();

  const hashedToken = hashSessionToken(currentToken);
  const session = await Session.findOne({
    _id: sessionId,
    token: hashedToken,
  });

  return !!session;
}

// Clean up expired sessions (called periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  await connectDB();

  const result = await Session.deleteMany({
    expiresAt: { $lt: new Date() },
  });

  return result.deletedCount;
}
