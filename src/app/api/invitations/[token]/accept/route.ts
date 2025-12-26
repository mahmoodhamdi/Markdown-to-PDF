/**
 * Accept Invitation API
 * POST /api/invitations/[token]/accept
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { acceptInvitation } from '@/lib/teams/invitation-service';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { token } = await params;

    const result = await acceptInvitation(
      token,
      session.user.id,
      session.user.email,
      session.user.name || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      teamId: result.teamId,
      message: 'Invitation accepted',
    });
  } catch (error) {
    console.error('Accept invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
