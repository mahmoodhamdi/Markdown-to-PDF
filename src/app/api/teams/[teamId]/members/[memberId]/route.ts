/**
 * Single Team Member API
 * PATCH /api/teams/[teamId]/members/[memberId] - Update member role
 * DELETE /api/teams/[teamId]/members/[memberId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { updateMemberRole, removeTeamMember, TeamRole } from '@/lib/teams/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ teamId: string; memberId: string }>;
}

const updateRoleSchema = z.object({
  role: z.enum(['member', 'admin']),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { teamId, memberId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:updateRole:${userId}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Update role
    const result = await updateMemberRole(
      teamId,
      userId,
      memberId,
      validation.data.role as TeamRole
    );

    if (!result.success || !result.member) {
      return NextResponse.json(
        { error: result.error || 'Failed to update role' },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        userId: result.member.userId,
        email: result.member.email,
        role: result.member.role,
      },
    });
  } catch (error) {
    console.error('Update member role API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { teamId, memberId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:removeMember:${userId}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Remove member
    const result = await removeTeamMember(teamId, userId, memberId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove member' },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
