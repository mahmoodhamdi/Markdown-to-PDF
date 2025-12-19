/**
 * SSO Audit Log API
 * GET /api/sso/audit - Get SSO audit logs for organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getSSOAuditLogs } from '@/lib/sso/service';
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

    // Only enterprise users can access SSO audit logs
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:audit:${userId}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get organization ID from query params
    const organizationId = request.nextUrl.searchParams.get('organizationId');
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Parse pagination params
    const limitParam = request.nextUrl.searchParams.get('limit');
    const skipParam = request.nextUrl.searchParams.get('skip');

    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }

    let skip = 0;
    if (skipParam) {
      const parsedSkip = parseInt(skipParam, 10);
      if (!isNaN(parsedSkip) && parsedSkip >= 0) {
        skip = parsedSkip;
      }
    }

    // Get audit logs
    const logs = await getSSOAuditLogs(
      organizationId,
      limit,
      skip
    );

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        limit,
        skip,
        count: logs.length,
        hasMore: logs.length === limit,
      },
    });
  } catch (error) {
    console.error('SSO audit GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
