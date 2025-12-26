/**
 * Invitation Token API
 * GET /api/invitations/[token] - Get invitation details by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvitationByToken } from '@/lib/teams/invitation-service';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const result = await getInvitationByToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
    });
  } catch (error) {
    console.error('Get invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
