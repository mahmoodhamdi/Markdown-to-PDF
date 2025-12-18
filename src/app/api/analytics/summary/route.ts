/**
 * Analytics Summary API
 * GET /api/analytics/summary - Get usage summary for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getUsageSummary } from '@/lib/analytics/service';
import { PlanType } from '@/lib/plans/config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userPlan = (session.user.plan as PlanType) || 'free';

    // Check rate limit
    const rateLimitResult = checkRateLimit(`analytics:summary:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get usage summary
    const summary = await getUsageSummary(userId, userPlan);

    return NextResponse.json({
      success: true,
      summary: {
        today: summary.today,
        thisWeek: summary.thisWeek,
        thisMonth: summary.thisMonth,
        limits: {
          conversionsPerDay: summary.limits.conversionsPerDay === Infinity ? 'unlimited' : summary.limits.conversionsPerDay,
          apiCallsPerDay: summary.limits.apiCallsPerDay === Infinity ? 'unlimited' : summary.limits.apiCallsPerDay,
        },
        remaining: {
          conversionsToday: summary.remaining.conversionsToday === Infinity ? 'unlimited' : summary.remaining.conversionsToday,
          apiCallsToday: summary.remaining.apiCallsToday === Infinity ? 'unlimited' : summary.remaining.apiCallsToday,
        },
        plan: userPlan,
      },
    });
  } catch (error) {
    console.error('Analytics summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
