/**
 * Decline Invitation API
 * POST /api/invitations/[token]/decline
 */

import { NextRequest, NextResponse } from 'next/server';
import { declineInvitation } from '@/lib/teams/invitation-service';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const result = await declineInvitation(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error) {
    console.error('Decline invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
