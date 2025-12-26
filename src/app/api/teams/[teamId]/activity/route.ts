/**
 * Team Activity API
 * GET /api/teams/[teamId]/activity - Get team activity log
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getTeamActivities, exportTeamActivities } from '@/lib/teams/activity-service';
import type { TeamActivityAction } from '@/lib/db/models/TeamActivity';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamId } = await params;
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action') as TeamActivityAction | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const format = searchParams.get('format');

    // Handle CSV export
    if (format === 'csv') {
      const result = await exportTeamActivities(teamId, session.user.id);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === 'Access denied' ? 403 : 400 }
        );
      }

      return new NextResponse(result.csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="team-activity-${teamId}.csv"`,
        },
      });
    }

    // Get activities
    const result = await getTeamActivities(teamId, session.user.id, {
      action: action || undefined,
      limit,
      skip,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      activities: result.activities,
      total: result.total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Team activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
