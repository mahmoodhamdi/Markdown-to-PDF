/**
 * Analytics History API
 * GET /api/analytics/history - Get usage history for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getUsageHistory } from '@/lib/analytics/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
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

    // Check rate limit
    const rateLimitResult = checkRateLimit(`analytics:history:${userId}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse days parameter (default 30, max 90)
    const daysParam = request.nextUrl.searchParams.get('days');
    let days = 30;
    if (daysParam) {
      const parsedDays = parseInt(daysParam, 10);
      if (!isNaN(parsedDays) && parsedDays > 0 && parsedDays <= 90) {
        days = parsedDays;
      }
    }

    // Get usage history
    const history = await getUsageHistory(userId, days);

    return NextResponse.json({
      success: true,
      history: {
        daily: history.daily,
        startDate: history.startDate,
        endDate: history.endDate,
        totalDays: history.daily.length,
      },
    });
  } catch (error) {
    console.error('Analytics history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
