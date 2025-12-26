/**
 * Team Activity Service
 * Handles logging and retrieving team activities
 */

import { connectDB } from '@/lib/db/mongodb';
import { TeamActivity, type ITeamActivity, type TeamActivityAction } from '@/lib/db/models/TeamActivity';
import { Team, type ITeamMember } from '@/lib/db/models/Team';

export interface LogActivityInput {
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: TeamActivityAction;
  details?: Record<string, unknown>;
}

export interface ActivityData {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: TeamActivityAction;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivityListResult {
  success: boolean;
  activities?: ActivityData[];
  total?: number;
  error?: string;
}

function toActivityData(doc: ITeamActivity): ActivityData {
  return {
    id: doc._id.toString(),
    teamId: doc.teamId,
    teamName: doc.teamName,
    userId: doc.userId,
    userEmail: doc.userEmail,
    userName: doc.userName,
    action: doc.action,
    details: doc.details || {},
    createdAt: doc.createdAt,
  };
}

/**
 * Log a team activity
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectDB();

    await TeamActivity.create({
      teamId: input.teamId,
      teamName: input.teamName,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      action: input.action,
      details: input.details || {},
    });
  } catch (error) {
    // Log but don't throw - activity logging should not block operations
    console.error('Log activity error:', error);
  }
}

/**
 * Get team activities with optional filtering and pagination
 */
export async function getTeamActivities(
  teamId: string,
  userId: string,
  options: {
    action?: TeamActivityAction;
    limit?: number;
    skip?: number;
  } = {}
): Promise<ActivityListResult> {
  try {
    await connectDB();

    // Verify user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const isMember = team.members.some((m: ITeamMember) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'Access denied' };
    }

    const query: Record<string, unknown> = { teamId };
    if (options.action) {
      query.action = options.action;
    }

    const limit = Math.min(options.limit || 50, 100);
    const skip = options.skip || 0;

    const [activities, total] = await Promise.all([
      TeamActivity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TeamActivity.countDocuments(query),
    ]);

    return {
      success: true,
      activities: activities.map(toActivityData),
      total,
    };
  } catch (error) {
    console.error('Get team activities error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get activities',
    };
  }
}

/**
 * Export team activities as CSV
 */
export async function exportTeamActivities(
  teamId: string,
  userId: string
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    await connectDB();

    // Verify user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const member = team.members.find((m: ITeamMember) => m.userId === userId);
    if (!member) {
      return { success: false, error: 'Access denied' };
    }

    // Only admins and owners can export
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { success: false, error: 'Only admins can export activity data' };
    }

    const activities = await TeamActivity.find({ teamId })
      .sort({ createdAt: -1 })
      .limit(1000);

    // Build CSV
    const headers = ['Date', 'User', 'Email', 'Action', 'Details'];
    const rows = activities.map((a) => [
      a.createdAt.toISOString(),
      a.userName || 'Unknown',
      a.userEmail,
      a.action,
      JSON.stringify(a.details),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return { success: true, csv };
  } catch (error) {
    console.error('Export team activities error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export activities',
    };
  }
}

// Helper functions for common activity logging

export async function logTeamCreated(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'team_created',
    details: {},
  });
}

export async function logTeamUpdated(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  changes: Record<string, unknown>
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'team_updated',
    details: { changes },
  });
}

export async function logSettingsUpdated(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  changes: Record<string, unknown>
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'settings_updated',
    details: { changes },
  });
}

export async function logMemberInvited(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  invitedEmail: string,
  role: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'member_invited',
    details: { invitedEmail, role },
  });
}

export async function logMemberJoined(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'member_joined',
    details: {},
  });
}

export async function logMemberRemoved(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  removedEmail: string,
  removedName?: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'member_removed',
    details: { removedEmail, removedName },
  });
}

export async function logMemberLeft(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'member_left',
    details: {},
  });
}

export async function logRoleChanged(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  memberEmail: string,
  memberName: string | undefined,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'role_changed',
    details: { memberEmail, memberName, oldRole, newRole },
  });
}

export async function logInvitationCanceled(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  invitedEmail: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'invitation_canceled',
    details: { invitedEmail },
  });
}

export async function logInvitationResent(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  invitedEmail: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'invitation_resent',
    details: { invitedEmail },
  });
}

export async function logTeamDeleted(
  teamId: string,
  teamName: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  await logActivity({
    teamId,
    teamName,
    userId,
    userEmail,
    userName,
    action: 'team_deleted',
    details: {},
  });
}
