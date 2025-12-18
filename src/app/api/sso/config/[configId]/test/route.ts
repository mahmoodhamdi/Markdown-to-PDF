/**
 * SSO Configuration Test API
 * POST /api/sso/config/[configId]/test - Test SSO configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getSSOConfig, testSSOConfig } from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only enterprise users can test SSO
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email || undefined;

    // Check rate limit (limited to prevent abuse)
    const rateLimitResult = checkRateLimit(`sso:test:${userId}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if config exists
    const existingConfig = await getSSOConfig(configId);
    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SSO configuration not found' },
        { status: 404 }
      );
    }

    // Test SSO configuration
    const testResult = await testSSOConfig(configId, userEmail);

    return NextResponse.json({
      success: testResult.success,
      result: testResult,
      message: testResult.success
        ? 'SSO configuration test passed'
        : 'SSO configuration test failed',
    });
  } catch (error) {
    console.error('SSO config test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
