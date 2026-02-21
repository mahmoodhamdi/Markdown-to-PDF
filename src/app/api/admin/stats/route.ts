/**
 * Admin Stats API
 * GET /api/admin/stats
 *
 * Returns a high-level system overview:
 *   - Total registered users
 *   - User breakdown by plan
 *   - Total conversions performed today (all users)
 *   - Total storage used (bytes) across all users
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { DailyUsage } from '@/lib/db/models/Usage';
import { StorageQuota } from '@/lib/db/models/UserFile';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(_request: NextRequest) {
  // Verify admin identity
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  // Rate limit: 60 requests per minute per admin
  const rateLimitResult = checkRateLimit(`admin:stats:${adminUser?.email ?? 'unknown'}`, 60, 60_000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    await connectDB();

    const today = new Date().toISOString().split('T')[0];

    // Run all aggregations in parallel for performance
    const [totalUsers, usersByPlan, todayConversionsResult, totalStorageResult] = await Promise.all(
      [
        // Total users
        User.countDocuments(),

        // Users grouped by plan
        User.aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$plan', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),

        // Sum of conversions across all users for today
        DailyUsage.aggregate<{ totalConversions: number }>([
          { $match: { date: today } },
          { $group: { _id: null, totalConversions: { $sum: '$conversions' } } },
        ]),

        // Sum of storage quota used across all users
        StorageQuota.aggregate<{ totalStorage: number }>([
          { $group: { _id: null, totalStorage: { $sum: '$used' } } },
        ]),
      ]
    );

    // Flatten plan breakdown into a plain object keyed by plan name
    const planBreakdown: Record<string, number> = {
      free: 0,
      pro: 0,
      team: 0,
      enterprise: 0,
    };
    for (const entry of usersByPlan) {
      if (entry._id in planBreakdown) {
        planBreakdown[entry._id] = entry.count;
      }
    }

    const totalConversionsToday = todayConversionsResult[0]?.totalConversions ?? 0;
    const totalStorageUsed = totalStorageResult[0]?.totalStorage ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        usersByPlan: planBreakdown,
        totalConversionsToday,
        totalStorageUsedBytes: totalStorageUsed,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
