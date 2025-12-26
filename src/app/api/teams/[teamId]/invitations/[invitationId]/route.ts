/**
 * Single Team Invitation API
 * DELETE /api/teams/[teamId]/invitations/[invitationId] - Cancel invitation
 * POST /api/teams/[teamId]/invitations/[invitationId]/resend - Resend invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { cancelInvitation } from '@/lib/teams/invitation-service';

interface RouteParams {
  params: Promise<{ teamId: string; invitationId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { invitationId } = await params;

    const result = await cancelInvitation(invitationId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation canceled',
    });
  } catch (error) {
    console.error('Cancel invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
