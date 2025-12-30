/**
 * Team Invitations API
 * GET /api/teams/[teamId]/invitations - List pending invitations
 * POST /api/teams/[teamId]/invitations - Create invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createInvitation, getTeamInvitations } from '@/lib/teams/invitation-service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).optional(),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamId } = await params;

    const result = await getTeamInvitations(teamId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitations: result.invitations,
    });
  } catch (error) {
    console.error('Get team invitations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { teamId } = await params;

    // Rate limit
    const rateLimitResult = checkRateLimit(`teams:invite:${userId}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse body
    const body = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const result = await createInvitation({
      teamId,
      email: validation.data.email,
      role: validation.data.role,
      invitedBy: userId,
      inviterEmail: session.user.email,
      inviterName: session.user.name || session.user.email.split('@')[0] || 'User',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
    });
  } catch (error) {
    console.error('Create invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
