/**
 * Sessions API Route
 * GET - List active sessions
 * DELETE - Revoke all other sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getUserSessions, revokeOtherSessions, isCurrentSession } from '@/lib/auth/session-service';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const sessions = await getUserSessions(userId);

    // Get current token to identify current session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const currentTokenId = typeof token?.jti === 'string' ? token.jti : '';

    // Map sessions with isCurrent flag
    const sessionsWithCurrent = await Promise.all(
      sessions.map(async (s) => ({
        id: s._id,
        browser: s.browser,
        os: s.os,
        device: s.device,
        ip: s.ip,
        location: s.location,
        lastActive: s.lastActive,
        createdAt: s.createdAt,
        isCurrent: await isCurrentSession(s._id, currentTokenId),
      }))
    );

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCurrent,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get sessions' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const currentTokenId = typeof token?.jti === 'string' ? token.jti : '';

    const revokedCount = await revokeOtherSessions(userId, currentTokenId);

    return NextResponse.json({
      success: true,
      revokedCount,
    });
  } catch (error) {
    console.error('Revoke sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke sessions' },
      { status: 500 }
    );
  }
}
