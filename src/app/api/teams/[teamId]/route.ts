/**
 * Single Team API
 * GET /api/teams/[teamId] - Get team details
 * PATCH /api/teams/[teamId] - Update team
 * DELETE /api/teams/[teamId] - Delete team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getTeam, updateTeam, deleteTeam } from '@/lib/teams/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z
    .object({
      allowMemberInvites: z.boolean().optional(),
      defaultMemberRole: z.enum(['member', 'admin']).optional(),
      sharedStorageEnabled: z.boolean().optional(),
      sharedTemplatesEnabled: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { teamId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:get:${userId}`, 120, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get team
    const result = await getTeam(teamId, userId);

    if (!result.success || !result.team) {
      return NextResponse.json(
        { error: result.error || 'Team not found' },
        { status: result.error === 'Access denied' ? 403 : 404 }
      );
    }

    const team = result.team;
    const currentUserRole = team.members.find((m) => m.userId === userId)?.role;

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        plan: team.plan,
        isOwner: team.ownerId === userId,
        currentUserRole,
        members: team.members.map((m) => ({
          userId: m.userId,
          email: m.email,
          name: m.name,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          invitedBy: m.invitedBy,
        })),
        settings: team.settings,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get team API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { teamId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:update:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = updateTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Update team
    const result = await updateTeam(teamId, userId, validation.data);

    if (!result.success || !result.team) {
      return NextResponse.json(
        { error: result.error || 'Failed to update team' },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      team: {
        id: result.team.id,
        name: result.team.name,
        settings: result.team.settings,
        updatedAt: result.team.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update team API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { teamId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:delete:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Delete team
    const result = await deleteTeam(teamId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete team' },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
