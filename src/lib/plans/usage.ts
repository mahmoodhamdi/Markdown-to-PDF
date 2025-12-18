/**
 * Usage tracking service for rate limiting per user plan
 */

import { adminDb } from '@/lib/firebase/admin';
import { getPlanLimits, PlanType } from './config';

export interface UsageData {
  conversions: number;
  apiCalls: number;
  lastReset: string; // ISO date string YYYY-MM-DD
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: string; // ISO timestamp for next reset
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date as ISO timestamp
 */
function getTomorrowReset(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Get default usage data for a new day
 */
function getDefaultUsage(): UsageData {
  return {
    conversions: 0,
    apiCalls: 0,
    lastReset: getToday(),
  };
}

/**
 * Get user's current usage data
 */
export async function getUserUsage(email: string): Promise<UsageData> {
  try {
    const userDoc = await adminDb.collection('users').doc(email).get();

    if (!userDoc.exists) {
      return getDefaultUsage();
    }

    const userData = userDoc.data();
    const usage = userData?.usage as UsageData | undefined;

    if (!usage) {
      return getDefaultUsage();
    }

    // Check if we need to reset for a new day
    const today = getToday();
    if (usage.lastReset !== today) {
      // Reset usage for new day
      const newUsage = getDefaultUsage();
      await adminDb.collection('users').doc(email).update({
        usage: newUsage,
      });
      return newUsage;
    }

    return usage;
  } catch (error) {
    console.error('Error getting user usage:', error);
    return getDefaultUsage();
  }
}

/**
 * Check if a conversion is allowed for the user
 */
export async function checkConversionLimit(
  email: string,
  plan: PlanType
): Promise<UsageCheckResult> {
  const usage = await getUserUsage(email);
  const limits = getPlanLimits(plan);

  const current = usage.conversions;
  const limit = limits.conversionsPerDay;
  const remaining = Math.max(0, limit - current);
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    remaining,
    resetAt: getTomorrowReset(),
  };
}

/**
 * Check if an API call is allowed for the user
 */
export async function checkApiCallLimit(
  email: string,
  plan: PlanType
): Promise<UsageCheckResult> {
  const usage = await getUserUsage(email);
  const limits = getPlanLimits(plan);

  const current = usage.apiCalls;
  const limit = limits.apiCallsPerDay;
  const remaining = Math.max(0, limit - current);
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    remaining,
    resetAt: getTomorrowReset(),
  };
}

/**
 * Check file size against plan limits
 */
export function checkFileSize(
  fileSize: number,
  plan: PlanType
): { allowed: boolean; maxSize: number; currentSize: number } {
  const limits = getPlanLimits(plan);
  const maxSize = limits.maxFileSize;

  return {
    allowed: fileSize <= maxSize,
    maxSize,
    currentSize: fileSize,
  };
}

/**
 * Check batch file count against plan limits
 */
export function checkBatchLimit(
  fileCount: number,
  plan: PlanType
): { allowed: boolean; maxFiles: number; currentFiles: number } {
  const limits = getPlanLimits(plan);
  const maxFiles = limits.maxBatchFiles;

  return {
    allowed: fileCount <= maxFiles,
    maxFiles,
    currentFiles: fileCount,
  };
}

/**
 * Increment conversion count for user
 */
export async function incrementConversions(
  email: string,
  count: number = 1
): Promise<void> {
  try {
    const usage = await getUserUsage(email);

    await adminDb.collection('users').doc(email).update({
      'usage.conversions': usage.conversions + count,
    });
  } catch (error) {
    console.error('Error incrementing conversions:', error);
  }
}

/**
 * Increment API call count for user
 */
export async function incrementApiCalls(
  email: string,
  count: number = 1
): Promise<void> {
  try {
    const usage = await getUserUsage(email);

    await adminDb.collection('users').doc(email).update({
      'usage.apiCalls': usage.apiCalls + count,
    });
  } catch (error) {
    console.error('Error incrementing API calls:', error);
  }
}

/**
 * Get full usage report for user
 */
export async function getUsageReport(
  email: string,
  plan: PlanType
): Promise<{
  usage: UsageData;
  limits: {
    conversions: UsageCheckResult;
    apiCalls: UsageCheckResult;
  };
}> {
  const usage = await getUserUsage(email);
  const limits = getPlanLimits(plan);

  return {
    usage,
    limits: {
      conversions: {
        allowed: usage.conversions < limits.conversionsPerDay,
        current: usage.conversions,
        limit: limits.conversionsPerDay,
        remaining: Math.max(0, limits.conversionsPerDay - usage.conversions),
        resetAt: getTomorrowReset(),
      },
      apiCalls: {
        allowed: usage.apiCalls < limits.apiCallsPerDay,
        current: usage.apiCalls,
        limit: limits.apiCallsPerDay,
        remaining: Math.max(0, limits.apiCallsPerDay - usage.apiCalls),
        resetAt: getTomorrowReset(),
      },
    },
  };
}
