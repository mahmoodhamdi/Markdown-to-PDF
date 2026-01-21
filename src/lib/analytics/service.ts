/**
 * Usage Analytics Service
 * Tracks user activity, conversions, and usage metrics
 * Uses MongoDB for data storage
 */

import { connectDB } from '@/lib/db/mongodb';
import { UsageEvent, DailyUsage, type EventType } from '@/lib/db/models/Usage';
import { PlanType, getPlanLimits } from '@/lib/plans/config';

export type { EventType } from '@/lib/db/models/Usage';

export interface UsageSummary {
  today: DailyUsageData;
  thisWeek: DailyUsageData;
  thisMonth: DailyUsageData;
  limits: {
    conversionsPerDay: number;
    apiCallsPerDay: number;
  };
  remaining: {
    conversionsToday: number;
    apiCallsToday: number;
  };
}

export interface DailyUsageData {
  date: string;
  conversions: number;
  apiCalls: number;
  fileUploads: number;
  fileDownloads: number;
  templatesUsed: number;
  batchConversions: number;
  storageUsed: number;
}

export interface UsageHistory {
  daily: DailyUsageData[];
  startDate: string;
  endDate: string;
}

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
    await connectDB();

    const now = new Date();
    const date = getCurrentDate();

    // Store individual event
    await UsageEvent.create({
      userId,
      eventType,
      metadata: metadata || {},
      timestamp: now,
      date,
    });

    // Update daily aggregation using upsert
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
      await DailyUsage.findOneAndUpdate(
        { userId, date },
        {
          $inc: { [field]: 1 },
          $setOnInsert: { userId, date },
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Failed to track event:', error);
    // Don't throw - analytics should not break the main flow
  }
}

/**
 * Get daily usage for a user
 */
export async function getDailyUsage(userId: string, date: string): Promise<DailyUsageData> {
  try {
    await connectDB();

    // Use lean() for faster read-only query
    const usage = await DailyUsage.findOne({ userId, date }).lean();

    if (!usage) {
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
      conversions: usage.conversions || 0,
      apiCalls: usage.apiCalls || 0,
      fileUploads: usage.fileUploads || 0,
      fileDownloads: usage.fileDownloads || 0,
      templatesUsed: usage.templatesUsed || 0,
      batchConversions: usage.batchConversions || 0,
      storageUsed: usage.storageUsed || 0,
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
): Promise<DailyUsageData> {
  try {
    await connectDB();

    const result = await DailyUsage.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          conversions: { $sum: '$conversions' },
          apiCalls: { $sum: '$apiCalls' },
          fileUploads: { $sum: '$fileUploads' },
          fileDownloads: { $sum: '$fileDownloads' },
          templatesUsed: { $sum: '$templatesUsed' },
          batchConversions: { $sum: '$batchConversions' },
          storageUsed: { $max: '$storageUsed' },
        },
      },
    ]);

    if (result.length === 0) {
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

    return {
      date: `${startDate} to ${endDate}`,
      conversions: result[0].conversions || 0,
      apiCalls: result[0].apiCalls || 0,
      fileUploads: result[0].fileUploads || 0,
      fileDownloads: result[0].fileDownloads || 0,
      templatesUsed: result[0].templatesUsed || 0,
      batchConversions: result[0].batchConversions || 0,
      storageUsed: result[0].storageUsed || 0,
    };
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
export async function getUsageSummary(userId: string, planType: PlanType): Promise<UsageSummary> {
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
export async function getUsageHistory(userId: string, days: number = 30): Promise<UsageHistory> {
  const endDate = getCurrentDate();
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - days + 1);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    await connectDB();

    // Use lean() for faster read-only query
    const usageData = await DailyUsage.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .lean();

    // Create a map of existing data
    const usageMap = new Map<string, DailyUsageData>();

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
    usageData.forEach((doc) => {
      usageMap.set(doc.date, {
        date: doc.date,
        conversions: doc.conversions || 0,
        apiCalls: doc.apiCalls || 0,
        fileUploads: doc.fileUploads || 0,
        fileDownloads: doc.fileDownloads || 0,
        templatesUsed: doc.templatesUsed || 0,
        batchConversions: doc.batchConversions || 0,
        storageUsed: doc.storageUsed || 0,
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
    await connectDB();
    return await UsageEvent.countDocuments({ userId });
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
    await connectDB();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const result = await UsageEvent.deleteMany({
      date: { $lt: cutoffStr },
    });

    return result.deletedCount || 0;
  } catch (error) {
    console.error('Failed to cleanup old events:', error);
    return 0;
  }
}
