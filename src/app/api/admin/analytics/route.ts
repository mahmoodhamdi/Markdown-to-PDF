/**
 * Admin Analytics API
 * GET /api/admin/analytics
 *
 * Returns system-wide analytics for the last 30 days:
 *   - conversionsPerDay  - total conversions each day
 *   - signupsPerDay      - number of new user registrations per day
 *   - activeUsersPerDay  - distinct users who performed at least one conversion per day
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { connectDB } from '@/lib/db/mongodb';
import { DailyUsage } from '@/lib/db/models/Usage';
import { User } from '@/lib/db/models/User';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/** Returns an ISO date string (YYYY-MM-DD) for a given day offset from today. */
function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/** Build a complete 30-day date range so gaps are shown as zero. */
function buildDateRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => dateOffset(days - 1 - i));
}

export async function GET(_request: NextRequest) {
  // Verify admin identity
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  // Rate limit: 60 requests per minute per admin
  const rateLimitResult = checkRateLimit(`admin:analytics:${adminUser?.email ?? 'unknown'}`, 60, 60_000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    await connectDB();

    const DAYS = 30;
    const startDate = dateOffset(DAYS - 1);

    // Conversions per day and active users per day — both come from DailyUsage
    const [conversionAgg, signupAgg] = await Promise.all([
      DailyUsage.aggregate<{ date: string; totalConversions: number; activeUsers: number }>([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: '$date',
            totalConversions: { $sum: '$conversions' },
            // Count distinct users who had at least 1 conversion
            activeUsers: {
              $sum: { $cond: [{ $gt: ['$conversions', 0] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', totalConversions: 1, activeUsers: 1 } },
      ]),

      // Signups per day — aggregate on createdAt from User collection
      User.aggregate<{ date: string; signups: number }>([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate + 'T00:00:00.000Z'),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
            },
            signups: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', signups: 1 } },
      ]),
    ]);

    // Index aggregation results by date for O(1) lookup
    const conversionByDate = new Map(conversionAgg.map((r) => [r.date, r]));
    const signupByDate = new Map(signupAgg.map((r) => [r.date, r]));

    // Build complete date range, filling in zeros for days with no data
    const dateRange = buildDateRange(DAYS);

    const conversionsPerDay = dateRange.map((date) => ({
      date,
      total: conversionByDate.get(date)?.totalConversions ?? 0,
    }));

    const activeUsersPerDay = dateRange.map((date) => ({
      date,
      total: conversionByDate.get(date)?.activeUsers ?? 0,
    }));

    const signupsPerDay = dateRange.map((date) => ({
      date,
      total: signupByDate.get(date)?.signups ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        periodDays: DAYS,
        conversionsPerDay,
        signupsPerDay,
        activeUsersPerDay,
      },
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
