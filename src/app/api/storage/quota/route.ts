/**
 * Storage Quota API
 * GET /api/storage/quota
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getStorageQuota, formatBytes } from '@/lib/storage/service';
import { PlanType, getPlanLimits } from '@/lib/plans/config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlan = (session.user.plan as PlanType) || 'free';

    // Check rate limit
    const rateLimitResult = checkRateLimit(`storage:quota:${userId}`, 60, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get quota
    const quota = await getStorageQuota(userId, userPlan);
    const limits = getPlanLimits(userPlan);

    return NextResponse.json({
      success: true,
      quota: {
        ...quota,
        usedFormatted: formatBytes(quota.used),
        limitFormatted: formatBytes(quota.limit),
        remainingFormatted: formatBytes(quota.remaining),
      },
      plan: {
        type: userPlan,
        storageEnabled: limits.cloudStorageBytes > 0,
      },
    });
  } catch (error) {
    console.error('Storage quota API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
