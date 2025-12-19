/**
 * Team Management Service
 * Handles team creation, member management, and team settings
 * Uses MongoDB for data storage
 */

import { connectDB } from '@/lib/db/mongodb';
import { Team, TeamMemberLookup, type ITeam, type ITeamMember, type TeamRole } from '@/lib/db/models/Team';
import { getPlanLimits, PlanType } from '@/lib/plans/config';

export type { TeamRole } from '@/lib/db/models/Team';

export interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy?: string;
}

export interface TeamData {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  plan: PlanType;
  members: TeamMember[];
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSettings {
  allowMemberInvites: boolean;
  defaultMemberRole: TeamRole;
  sharedStorageEnabled: boolean;
  sharedTemplatesEnabled: boolean;
}

export interface CreateTeamInput {
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
  plan: PlanType;
}

export interface InviteMemberInput {
  email: string;
  name?: string;
  role?: TeamRole;
  invitedBy: string;
}

export interface TeamResult {
  success: boolean;
  team?: TeamData;
  error?: string;
}

export interface TeamListResult {
  success: boolean;
  teams?: TeamData[];
  error?: string;
}

export interface MemberResult {
  success: boolean;
  member?: TeamMember;
  error?: string;
}

/**
 * Convert MongoDB team document to TeamData
 */
function toTeamData(doc: ITeam): TeamData {
  return {
    id: doc._id.toString(),
    name: doc.name,
    ownerId: doc.ownerId,
    ownerEmail: doc.ownerEmail,
    plan: doc.plan,
    members: doc.members.map((m: ITeamMember) => ({
      userId: m.userId,
      email: m.email,
      name: m.name,
      role: m.role,
      joinedAt: m.joinedAt,
      invitedBy: m.invitedBy,
    })),
    settings: {
      allowMemberInvites: doc.settings.allowMemberInvites,
      defaultMemberRole: doc.settings.defaultMemberRole,
      sharedStorageEnabled: doc.settings.sharedStorageEnabled,
      sharedTemplatesEnabled: doc.settings.sharedTemplatesEnabled,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Create a new team
 */
export async function createTeam(input: CreateTeamInput): Promise<TeamResult> {
  try {
    await connectDB();

    // Validate plan allows teams
    const limits = getPlanLimits(input.plan);
    if (limits.teamMembersAllowed === 0) {
      return {
        success: false,
        error: 'Team features are not available on your plan',
      };
    }

    // Check if user already owns a team
    const existingTeam = await Team.findOne({ ownerId: input.ownerId });
    if (existingTeam) {
      return {
        success: false,
        error: 'You already own a team',
      };
    }

    // Create team
    const now = new Date();
    const ownerMember: ITeamMember = {
      userId: input.ownerId,
      email: input.ownerEmail,
      name: input.ownerName,
      role: 'owner',
      joinedAt: now,
    };

    const team = await Team.create({
      name: input.name,
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail,
      plan: input.plan,
      members: [ownerMember],
      settings: {
        allowMemberInvites: false,
        defaultMemberRole: 'member',
        sharedStorageEnabled: true,
        sharedTemplatesEnabled: true,
      },
    });

    // Add to team_members lookup collection
    await TeamMemberLookup.create({
      teamId: team._id.toString(),
      userId: input.ownerId,
      email: input.ownerEmail,
      role: 'owner',
      joinedAt: now,
      status: 'active',
    });

    return {
      success: true,
      team: toTeamData(team),
    };
  } catch (error) {
    console.error('Create team error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create team',
    };
  }
}

/**
 * Get a team by ID
 */
export async function getTeam(teamId: string, userId: string): Promise<TeamResult> {
  try {
    await connectDB();

    const team = await Team.findById(teamId);

    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    // Check if user is a member
    const isMember = team.members.some((m: ITeamMember) => m.userId === userId);
    if (!isMember) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    return {
      success: true,
      team: toTeamData(team),
    };
  } catch (error) {
    console.error('Get team error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get team',
    };
  }
}

/**
 * Get all teams for a user
 */
export async function getTeamsForUser(userId: string): Promise<TeamListResult> {
  try {
    await connectDB();

    // Get team memberships
    const memberships = await TeamMemberLookup.find({ userId });

    if (memberships.length === 0) {
      return {
        success: true,
        teams: [],
      };
    }

    // Get team details
    const teamIds = memberships.map((m) => m.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } });

    return {
      success: true,
      teams: teams.map(toTeamData),
    };
  } catch (error) {
    console.error('Get teams for user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get teams',
    };
  }
}

/**
 * Update team settings
 */
export async function updateTeam(
  teamId: string,
  userId: string,
  updates: { name?: string; settings?: Partial<TeamSettings> }
): Promise<TeamResult> {
  try {
    await connectDB();

    const teamResult = await getTeam(teamId, userId);
    if (!teamResult.success || !teamResult.team) {
      return teamResult;
    }

    // Check if user is owner or admin
    const member = teamResult.team.members.find((m) => m.userId === userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return {
        success: false,
        error: 'Only team owners and admins can update team settings',
      };
    }

    const updateData: Record<string, unknown> = {};

    if (updates.name) {
      updateData.name = updates.name;
    }

    if (updates.settings) {
      updateData.settings = {
        ...teamResult.team.settings,
        ...updates.settings,
      };
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedTeam) {
      return {
        success: false,
        error: 'Failed to update team',
      };
    }

    return {
      success: true,
      team: toTeamData(updatedTeam),
    };
  } catch (error) {
    console.error('Update team error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team',
    };
  }
}

/**
 * Delete a team (owner only)
 */
export async function deleteTeam(teamId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    // Only owner can delete
    if (team.ownerId !== userId) {
      return {
        success: false,
        error: 'Only the team owner can delete the team',
      };
    }

    // Delete all member records
    await TeamMemberLookup.deleteMany({ teamId });

    // Delete team
    await Team.findByIdAndDelete(teamId);

    return { success: true };
  } catch (error) {
    console.error('Delete team error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete team',
    };
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  input: InviteMemberInput
): Promise<MemberResult> {
  try {
    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    // Check if user can invite
    const inviter = team.members.find((m: ITeamMember) => m.userId === userId);
    if (!inviter) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Check permission
    const canInvite =
      inviter.role === 'owner' ||
      inviter.role === 'admin' ||
      (team.settings.allowMemberInvites && inviter.role === 'member');

    if (!canInvite) {
      return {
        success: false,
        error: 'You do not have permission to invite members',
      };
    }

    // Check member limit
    const limits = getPlanLimits(team.plan);
    if (limits.teamMembersAllowed !== Infinity && team.members.length >= limits.teamMembersAllowed) {
      return {
        success: false,
        error: `Team member limit reached (${limits.teamMembersAllowed} members)`,
      };
    }

    // Check if already a member
    const existingMember = team.members.find((m: ITeamMember) => m.email === input.email);
    if (existingMember) {
      return {
        success: false,
        error: 'User is already a team member',
      };
    }

    // Create member
    const now = new Date();
    const newMemberId = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const role = input.role || team.settings.defaultMemberRole;

    // Only owner can add admins
    const effectiveRole = role === 'admin' && inviter.role !== 'owner' ? 'member' : role;

    const newMember: ITeamMember = {
      userId: newMemberId,
      email: input.email,
      name: input.name,
      role: effectiveRole,
      joinedAt: now,
      invitedBy: userId,
    };

    // Update team
    await Team.findByIdAndUpdate(teamId, {
      $push: { members: newMember },
    });

    // Add member lookup record
    await TeamMemberLookup.create({
      teamId,
      userId: newMemberId,
      email: input.email,
      role: effectiveRole,
      joinedAt: now,
      invitedBy: userId,
      status: 'pending',
    });

    return {
      success: true,
      member: {
        userId: newMemberId,
        email: input.email,
        name: input.name,
        role: effectiveRole,
        joinedAt: now,
        invitedBy: userId,
      },
    };
  } catch (error) {
    console.error('Add team member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add member',
    };
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
  memberIdToRemove: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    // Check if user can remove members
    const remover = team.members.find((m: ITeamMember) => m.userId === userId);
    if (!remover) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    const memberToRemove = team.members.find((m: ITeamMember) => m.userId === memberIdToRemove);
    if (!memberToRemove) {
      return {
        success: false,
        error: 'Member not found',
      };
    }

    // Cannot remove owner
    if (memberToRemove.role === 'owner') {
      return {
        success: false,
        error: 'Cannot remove team owner',
      };
    }

    // Check permission
    const canRemove =
      userId === memberIdToRemove || // Can remove self
      remover.role === 'owner' ||
      (remover.role === 'admin' && memberToRemove.role === 'member');

    if (!canRemove) {
      return {
        success: false,
        error: 'You do not have permission to remove this member',
      };
    }

    // Remove member
    await Team.findByIdAndUpdate(teamId, {
      $pull: { members: { userId: memberIdToRemove } },
    });

    // Remove member lookup record
    await TeamMemberLookup.deleteOne({ teamId, userId: memberIdToRemove });

    return { success: true };
  } catch (error) {
    console.error('Remove team member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove member',
    };
  }
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  teamId: string,
  userId: string,
  memberIdToUpdate: string,
  newRole: TeamRole
): Promise<MemberResult> {
  try {
    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    // Only owner can change roles
    if (team.ownerId !== userId) {
      return {
        success: false,
        error: 'Only the team owner can change member roles',
      };
    }

    // Cannot change owner role
    if (memberIdToUpdate === team.ownerId) {
      return {
        success: false,
        error: 'Cannot change owner role',
      };
    }

    const memberIndex = team.members.findIndex((m: ITeamMember) => m.userId === memberIdToUpdate);
    if (memberIndex === -1) {
      return {
        success: false,
        error: 'Member not found',
      };
    }

    // Update member role
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: teamId, 'members.userId': memberIdToUpdate },
      { $set: { 'members.$.role': newRole } },
      { new: true }
    );

    if (!updatedTeam) {
      return {
        success: false,
        error: 'Failed to update role',
      };
    }

    // Update member lookup record
    await TeamMemberLookup.updateOne(
      { teamId, userId: memberIdToUpdate },
      { $set: { role: newRole } }
    );

    const updatedMember = updatedTeam.members.find((m: ITeamMember) => m.userId === memberIdToUpdate);

    return {
      success: true,
      member: updatedMember ? {
        userId: updatedMember.userId,
        email: updatedMember.email,
        name: updatedMember.name,
        role: updatedMember.role,
        joinedAt: updatedMember.joinedAt,
        invitedBy: updatedMember.invitedBy,
      } : undefined,
    };
  } catch (error) {
    console.error('Update member role error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    };
  }
}

/**
 * Get team member count
 */
export function getTeamMemberCount(team: TeamData): number {
  return team.members.length;
}

/**
 * Get team member limit for plan
 */
export function getTeamMemberLimit(plan: PlanType): number {
  const limits = getPlanLimits(plan);
  return limits.teamMembersAllowed;
}

/**
 * Check if user is team owner
 */
export function isTeamOwner(team: TeamData, userId: string): boolean {
  return team.ownerId === userId;
}

/**
 * Check if user is team admin
 */
export function isTeamAdmin(team: TeamData, userId: string): boolean {
  const member = team.members.find((m) => m.userId === userId);
  return member?.role === 'admin' || member?.role === 'owner';
}

/**
 * Get user's role in team
 */
export function getUserTeamRole(team: TeamData, userId: string): TeamRole | null {
  const member = team.members.find((m) => m.userId === userId);
  return member?.role || null;
}
