/**
 * Single Session API Route
 * DELETE - Revoke a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { revokeSession, isCurrentSession } from '@/lib/auth/session-service';
import { getToken } from 'next-auth/jwt';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const userId = session.user.email;

    // Get current token to prevent revoking current session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const currentTokenId = typeof token?.jti === 'string' ? token.jti : '';

    // Check if trying to revoke current session
    const isCurrent = await isCurrentSession(sessionId, currentTokenId);
    if (isCurrent) {
      return NextResponse.json(
        { success: false, error: 'Cannot revoke current session' },
        { status: 400 }
      );
    }

    const revoked = await revokeSession(sessionId, userId);

    if (!revoked) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
