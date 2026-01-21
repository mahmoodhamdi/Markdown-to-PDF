/**
 * Files List API
 * GET /api/storage/files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { listFiles } from '@/lib/storage/service';
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
    const rateLimitResult = checkRateLimit(`storage:list:${userId}`, 60, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if storage is available for the plan
    const limits = getPlanLimits(userPlan);
    if (limits.cloudStorageBytes === 0) {
      return NextResponse.json({
        success: true,
        files: [],
        quota: {
          used: 0,
          limit: 0,
          remaining: 0,
          percentage: 0,
        },
        message: 'Cloud storage is not available on your plan',
      });
    }

    // List files
    const result = await listFiles(userId, userPlan);

    if (!result.success || !result.files) {
      return NextResponse.json({ error: result.error || 'Failed to list files' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      files: result.files.map((file) => ({
        id: file.id,
        filename: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      quota: result.quota,
    });
  } catch (error) {
    console.error('List files API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
