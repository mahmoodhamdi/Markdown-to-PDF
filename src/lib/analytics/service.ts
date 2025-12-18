/**
 * Usage Analytics Service
 * Tracks user activity, conversions, and usage metrics
 */

import { adminDb } from '@/lib/firebase/admin';
import { PlanType, getPlanLimits } from '@/lib/plans/config';

export type EventType =
  | 'conversion'
  | 'api_call'
  | 'file_upload'
  | 'file_download'
  | 'template_used'
  | 'batch_conversion';

export interface UsageEvent {
  id: string;
  userId: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  date: string; // YYYY-MM-DD for daily aggregation
}

export interface DailyUsage {
  date: string;
  conversions: number;
  apiCalls: number;
  fileUploads: number;
  fileDownloads: number;
  templatesUsed: number;
  batchConversions: number;
  storageUsed: number;
}

export interface UsageSummary {
  today: DailyUsage;
  thisWeek: DailyUsage;
  thisMonth: DailyUsage;
  limits: {
    conversionsPerDay: number;
    apiCallsPerDay: number;
  };
  remaining: {
    conversionsToday: number;
    apiCallsToday: number;
  };
}

export interface UsageHistory {
  daily: DailyUsage[];
  startDate: string;
  endDate: string;
}

// Collection names
const EVENTS_COLLECTION = 'usage_events';
const DAILY_USAGE_COLLECTION = 'daily_usage';

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get start of week (Sunday) in YYYY-MM-DD format
 */
function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

/**
 * Get start of month in YYYY-MM-DD format
 */
function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Track a usage event
 */
export async function trackEvent(
  userId: string,
  eventType: EventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const now = new Date();
    const date = getCurrentDate();
    const eventId = `${userId}_${eventType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Store individual event
    await adminDb.collection(EVENTS_COLLECTION).doc(eventId).set({
      id: eventId,
      userId,
      eventType,
      metadata: metadata || {},
      timestamp: now.toISOString(),
      date,
    });

    // Update daily aggregation
    const dailyKey = `${userId}_${date}`;
    const dailyRef = adminDb.collection(DAILY_USAGE_COLLECTION).doc(dailyKey);

    await adminDb.runTransaction(async (transaction) => {
      const dailyDoc = await transaction.get(dailyRef);

      const defaultUsage: Record<string, number | string> = {
        conversions: 0,
        apiCalls: 0,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
        userId,
        date,
      };

      const docData = dailyDoc.exists ? dailyDoc.data() : null;
      const currentUsage: Record<string, number | string> = docData
        ? { ...docData }
        : { ...defaultUsage };

      // Increment the appropriate counter
      const fieldMap: Record<EventType, string> = {
        conversion: 'conversions',
        api_call: 'apiCalls',
        file_upload: 'fileUploads',
        file_download: 'fileDownloads',
        template_used: 'templatesUsed',
        batch_conversion: 'batchConversions',
      };

      const field = fieldMap[eventType];
      if (field) {
        const currentValue = typeof currentUsage[field] === 'number' ? currentUsage[field] : 0;
        currentUsage[field] = (currentValue as number) + 1;
      }

      currentUsage.updatedAt = now.toISOString();

      transaction.set(dailyRef, currentUsage);
    });
  } catch (error) {
    console.error('Failed to track event:', error);
    // Don't throw - analytics should not break the main flow
  }
}

/**
 * Get daily usage for a user
 */
export async function getDailyUsage(userId: string, date: string): Promise<DailyUsage> {
  try {
    const dailyKey = `${userId}_${date}`;
    const doc = await adminDb.collection(DAILY_USAGE_COLLECTION).doc(dailyKey).get();

    if (!doc.exists) {
      return {
        date,
        conversions: 0,
        apiCalls: 0,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      };
    }

    const data = doc.data();
    if (!data) {
      return {
        date,
        conversions: 0,
        apiCalls: 0,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      };
    }

    return {
      date,
      conversions: data.conversions || 0,
      apiCalls: data.apiCalls || 0,
      fileUploads: data.fileUploads || 0,
      fileDownloads: data.fileDownloads || 0,
      templatesUsed: data.templatesUsed || 0,
      batchConversions: data.batchConversions || 0,
      storageUsed: data.storageUsed || 0,
    };
  } catch (error) {
    console.error('Failed to get daily usage:', error);
    return {
      date,
      conversions: 0,
      apiCalls: 0,
      fileUploads: 0,
      fileDownloads: 0,
      templatesUsed: 0,
      batchConversions: 0,
      storageUsed: 0,
    };
  }
}

/**
 * Get aggregated usage for a date range
 */
export async function getUsageRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyUsage> {
  try {
    const snapshot = await adminDb
      .collection(DAILY_USAGE_COLLECTION)
      .where('userId', '==', userId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const totals: DailyUsage = {
      date: `${startDate} to ${endDate}`,
      conversions: 0,
      apiCalls: 0,
      fileUploads: 0,
      fileDownloads: 0,
      templatesUsed: 0,
      batchConversions: 0,
      storageUsed: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totals.conversions += data.conversions || 0;
      totals.apiCalls += data.apiCalls || 0;
      totals.fileUploads += data.fileUploads || 0;
      totals.fileDownloads += data.fileDownloads || 0;
      totals.templatesUsed += data.templatesUsed || 0;
      totals.batchConversions += data.batchConversions || 0;
      totals.storageUsed = Math.max(totals.storageUsed, data.storageUsed || 0);
    });

    return totals;
  } catch (error) {
    console.error('Failed to get usage range:', error);
    return {
      date: `${startDate} to ${endDate}`,
      conversions: 0,
      apiCalls: 0,
      fileUploads: 0,
      fileDownloads: 0,
      templatesUsed: 0,
      batchConversions: 0,
      storageUsed: 0,
    };
  }
}

/**
 * Get usage summary for a user
 */
export async function getUsageSummary(
  userId: string,
  planType: PlanType
): Promise<UsageSummary> {
  const today = getCurrentDate();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const [todayUsage, weekUsage, monthUsage] = await Promise.all([
    getDailyUsage(userId, today),
    getUsageRange(userId, weekStart, today),
    getUsageRange(userId, monthStart, today),
  ]);

  const limits = getPlanLimits(planType);

  return {
    today: todayUsage,
    thisWeek: weekUsage,
    thisMonth: monthUsage,
    limits: {
      conversionsPerDay: limits.conversionsPerDay,
      apiCallsPerDay: limits.apiCallsPerDay,
    },
    remaining: {
      conversionsToday:
        limits.conversionsPerDay === Infinity
          ? Infinity
          : Math.max(0, limits.conversionsPerDay - todayUsage.conversions),
      apiCallsToday:
        limits.apiCallsPerDay === Infinity
          ? Infinity
          : Math.max(0, limits.apiCallsPerDay - todayUsage.apiCalls),
    },
  };
}

/**
 * Get usage history for a user (last N days)
 */
export async function getUsageHistory(
  userId: string,
  days: number = 30
): Promise<UsageHistory> {
  const endDate = getCurrentDate();
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - days + 1);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const snapshot = await adminDb
      .collection(DAILY_USAGE_COLLECTION)
      .where('userId', '==', userId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();

    const usageMap = new Map<string, DailyUsage>();

    // Initialize all days with zero values
    const currentDate = new Date(startDateObj);
    const endDateObj = new Date(endDate);
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      usageMap.set(dateStr, {
        date: dateStr,
        conversions: 0,
        apiCalls: 0,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in actual data
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      usageMap.set(data.date, {
        date: data.date,
        conversions: data.conversions || 0,
        apiCalls: data.apiCalls || 0,
        fileUploads: data.fileUploads || 0,
        fileDownloads: data.fileDownloads || 0,
        templatesUsed: data.templatesUsed || 0,
        batchConversions: data.batchConversions || 0,
        storageUsed: data.storageUsed || 0,
      });
    });

    return {
      daily: Array.from(usageMap.values()),
      startDate,
      endDate,
    };
  } catch (error) {
    console.error('Failed to get usage history:', error);
    return {
      daily: [],
      startDate,
      endDate,
    };
  }
}

/**
 * Check if user is within daily limits
 */
export async function checkDailyLimits(
  userId: string,
  planType: PlanType
): Promise<{
  withinLimits: boolean;
  conversionsRemaining: number;
  apiCallsRemaining: number;
}> {
  const today = getCurrentDate();
  const todayUsage = await getDailyUsage(userId, today);
  const limits = getPlanLimits(planType);

  const conversionsRemaining =
    limits.conversionsPerDay === Infinity
      ? Infinity
      : Math.max(0, limits.conversionsPerDay - todayUsage.conversions);

  const apiCallsRemaining =
    limits.apiCallsPerDay === Infinity
      ? Infinity
      : Math.max(0, limits.apiCallsPerDay - todayUsage.apiCalls);

  return {
    withinLimits: conversionsRemaining > 0 && apiCallsRemaining > 0,
    conversionsRemaining,
    apiCallsRemaining,
  };
}

/**
 * Get total event count for a user
 */
export async function getTotalEventCount(userId: string): Promise<number> {
  try {
    const snapshot = await adminDb
      .collection(EVENTS_COLLECTION)
      .where('userId', '==', userId)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error) {
    console.error('Failed to get event count:', error);
    return 0;
  }
}

/**
 * Clean up old events (older than 90 days)
 */
export async function cleanupOldEvents(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const snapshot = await adminDb
      .collection(EVENTS_COLLECTION)
      .where('date', '<', cutoffStr)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error('Failed to cleanup old events:', error);
    return 0;
  }
}
