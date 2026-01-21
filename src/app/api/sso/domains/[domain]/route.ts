/**
 * SSO Domain Management API
 * GET /api/sso/domains/[domain] - Get domain mapping
 * DELETE /api/sso/domains/[domain] - Delete domain mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getDomainMapping, deleteDomainMapping } from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only enterprise users can access SSO
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:domains:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get domain mapping
    const mapping = await getDomainMapping(domain);

    if (!mapping) {
      return NextResponse.json({ error: 'Domain mapping not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      domain: mapping,
    });
  } catch (error) {
    console.error('SSO domain GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only enterprise users can configure SSO
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:domains:delete:${userId}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Delete domain mapping
    const deleted = await deleteDomainMapping(domain);

    if (!deleted) {
      return NextResponse.json({ error: 'Domain mapping not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Domain mapping deleted successfully',
    });
  } catch (error) {
    console.error('SSO domain DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
