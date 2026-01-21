/**
 * Teams API
 * GET /api/teams - List user's teams
 * POST /api/teams - Create a new team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createTeam, getTeamsForUser } from '@/lib/teams/service';
import { PlanType, getPlanLimits } from '@/lib/plans/config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:list:${userId}`, 60, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get teams
    const result = await getTeamsForUser(userId);

    if (!result.success || !result.teams) {
      return NextResponse.json({ error: result.error || 'Failed to get teams' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      teams: result.teams.map((team) => ({
        id: team.id,
        name: team.name,
        plan: team.plan,
        memberCount: team.members.length,
        role: team.members.find((m) => m.userId === userId)?.role,
        isOwner: team.ownerId === userId,
        createdAt: team.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('List teams API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name || undefined;
    const userPlan = (session.user.plan as PlanType) || 'free';

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:create:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if plan allows teams
    const limits = getPlanLimits(userPlan);
    if (limits.teamMembersAllowed === 0) {
      return NextResponse.json(
        {
          error:
            'Team features are not available on your plan. Please upgrade to Team or Enterprise.',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Create team
    const result = await createTeam({
      name: validation.data.name,
      ownerId: userId,
      ownerEmail: userEmail,
      ownerName: userName,
      plan: userPlan,
    });

    if (!result.success || !result.team) {
      return NextResponse.json({ error: result.error || 'Failed to create team' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      team: {
        id: result.team.id,
        name: result.team.name,
        plan: result.team.plan,
        memberCount: result.team.members.length,
        role: 'owner',
        isOwner: true,
        createdAt: result.team.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create team API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
