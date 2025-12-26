/**
 * Resend Team Invitation API
 * POST /api/teams/[teamId]/invitations/[invitationId]/resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { resendInvitation } from '@/lib/teams/invitation-service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ teamId: string; invitationId: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { invitationId } = await params;

    // Rate limit
    const rateLimitResult = checkRateLimit(`teams:resend:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const result = await resendInvitation(invitationId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent',
    });
  } catch (error) {
    console.error('Resend invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
