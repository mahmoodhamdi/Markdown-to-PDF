/**
 * Team Members API
 * POST /api/teams/[teamId]/members - Add a member to the team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { addTeamMember } from '@/lib/teams/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

const addMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['member', 'admin']).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { teamId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`teams:addMember:${userId}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Add member
    const result = await addTeamMember(teamId, userId, {
      email: validation.data.email,
      name: validation.data.name,
      role: validation.data.role,
      invitedBy: userId,
    });

    if (!result.success || !result.member) {
      return NextResponse.json(
        { error: result.error || 'Failed to add member' },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        userId: result.member.userId,
        email: result.member.email,
        name: result.member.name,
        role: result.member.role,
        joinedAt: result.member.joinedAt.toISOString(),
        invitedBy: result.member.invitedBy,
      },
    });
  } catch (error) {
    console.error('Add team member API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
