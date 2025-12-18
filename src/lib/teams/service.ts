/**
 * Team Management Service
 * Handles team creation, member management, and team settings
 */

import { adminDb } from '@/lib/firebase/admin';
import { getPlanLimits, PlanType } from '@/lib/plans/config';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy?: string;
}

export interface Team {
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
  team?: Team;
  error?: string;
}

export interface TeamListResult {
  success: boolean;
  teams?: Team[];
  error?: string;
}

export interface MemberResult {
  success: boolean;
  member?: TeamMember;
  error?: string;
}

// Collection names
const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERS_COLLECTION = 'team_members';

/**
 * Default team settings
 */
const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  allowMemberInvites: false,
  defaultMemberRole: 'member',
  sharedStorageEnabled: true,
  sharedTemplatesEnabled: true,
};

/**
 * Create a new team
 */
export async function createTeam(input: CreateTeamInput): Promise<TeamResult> {
  try {
    // Validate plan allows teams
    const limits = getPlanLimits(input.plan);
    if (limits.teamMembersAllowed === 0) {
      return {
        success: false,
        error: 'Team features are not available on your plan',
      };
    }

    // Check if user already owns a team
    const existingTeams = await adminDb
      .collection(TEAMS_COLLECTION)
      .where('ownerId', '==', input.ownerId)
      .get();

    if (!existingTeams.empty) {
      return {
        success: false,
        error: 'You already own a team',
      };
    }

    // Create team
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const ownerMember: TeamMember = {
      userId: input.ownerId,
      email: input.ownerEmail,
      name: input.ownerName,
      role: 'owner',
      joinedAt: now,
    };

    const team: Team = {
      id: teamId,
      name: input.name,
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail,
      plan: input.plan,
      members: [ownerMember],
      settings: { ...DEFAULT_TEAM_SETTINGS },
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(TEAMS_COLLECTION).doc(teamId).set({
      ...team,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      members: team.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
    });

    // Also add to team_members collection for efficient lookups
    await adminDb.collection(TEAM_MEMBERS_COLLECTION).doc(`${teamId}_${input.ownerId}`).set({
      teamId,
      userId: input.ownerId,
      email: input.ownerEmail,
      role: 'owner',
      joinedAt: now.toISOString(),
    });

    return {
      success: true,
      team,
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
    const doc = await adminDb.collection(TEAMS_COLLECTION).doc(teamId).get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    const data = doc.data();
    if (!data) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    // Check if user is a member
    const isMember = data.members.some((m: TeamMember) => m.userId === userId);
    if (!isMember) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    const team: Team = {
      id: data.id,
      name: data.name,
      ownerId: data.ownerId,
      ownerEmail: data.ownerEmail,
      plan: data.plan,
      members: data.members.map((m: TeamMember & { joinedAt: string }) => ({
        ...m,
        joinedAt: new Date(m.joinedAt),
      })),
      settings: data.settings,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };

    return {
      success: true,
      team,
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
    // Get team memberships
    const membershipsSnapshot = await adminDb
      .collection(TEAM_MEMBERS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    if (membershipsSnapshot.empty) {
      return {
        success: true,
        teams: [],
      };
    }

    // Get team details
    const teamIds = membershipsSnapshot.docs.map((doc) => doc.data().teamId);
    const teams: Team[] = [];

    for (const teamId of teamIds) {
      const teamDoc = await adminDb.collection(TEAMS_COLLECTION).doc(teamId).get();
      if (teamDoc.exists) {
        const data = teamDoc.data();
        if (data) {
          teams.push({
            id: data.id,
            name: data.name,
            ownerId: data.ownerId,
            ownerEmail: data.ownerEmail,
            plan: data.plan,
            members: data.members.map((m: TeamMember & { joinedAt: string }) => ({
              ...m,
              joinedAt: new Date(m.joinedAt),
            })),
            settings: data.settings,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          });
        }
      }
    }

    return {
      success: true,
      teams,
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

    const now = new Date();
    const updateData: Record<string, unknown> = {
      updatedAt: now.toISOString(),
    };

    if (updates.name) {
      updateData.name = updates.name;
    }

    if (updates.settings) {
      updateData.settings = {
        ...teamResult.team.settings,
        ...updates.settings,
      };
    }

    await adminDb.collection(TEAMS_COLLECTION).doc(teamId).update(updateData);

    const updatedTeam: Team = {
      ...teamResult.team,
      name: updates.name || teamResult.team.name,
      settings: updates.settings
        ? { ...teamResult.team.settings, ...updates.settings }
        : teamResult.team.settings,
      updatedAt: now,
    };

    return {
      success: true,
      team: updatedTeam,
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
    const teamResult = await getTeam(teamId, userId);
    if (!teamResult.success || !teamResult.team) {
      return {
        success: false,
        error: teamResult.error || 'Team not found',
      };
    }

    // Only owner can delete
    if (teamResult.team.ownerId !== userId) {
      return {
        success: false,
        error: 'Only the team owner can delete the team',
      };
    }

    // Delete all member records
    const memberDocs = await adminDb
      .collection(TEAM_MEMBERS_COLLECTION)
      .where('teamId', '==', teamId)
      .get();

    const batch = adminDb.batch();
    memberDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete team
    batch.delete(adminDb.collection(TEAMS_COLLECTION).doc(teamId));

    await batch.commit();

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
    const teamResult = await getTeam(teamId, userId);
    if (!teamResult.success || !teamResult.team) {
      return {
        success: false,
        error: teamResult.error || 'Team not found',
      };
    }

    const team = teamResult.team;

    // Check if user can invite
    const inviter = team.members.find((m) => m.userId === userId);
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
    const existingMember = team.members.find((m) => m.email === input.email);
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

    const newMember: TeamMember = {
      userId: newMemberId, // Placeholder until user accepts
      email: input.email,
      name: input.name,
      role: effectiveRole,
      joinedAt: now,
      invitedBy: userId,
    };

    // Update team
    const updatedMembers = [...team.members, newMember];
    await adminDb.collection(TEAMS_COLLECTION).doc(teamId).update({
      members: updatedMembers.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      updatedAt: now.toISOString(),
    });

    // Add member lookup record
    await adminDb.collection(TEAM_MEMBERS_COLLECTION).doc(`${teamId}_${newMemberId}`).set({
      teamId,
      userId: newMemberId,
      email: input.email,
      role: effectiveRole,
      joinedAt: now.toISOString(),
      invitedBy: userId,
      status: 'pending',
    });

    return {
      success: true,
      member: newMember,
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
    const teamResult = await getTeam(teamId, userId);
    if (!teamResult.success || !teamResult.team) {
      return {
        success: false,
        error: teamResult.error || 'Team not found',
      };
    }

    const team = teamResult.team;

    // Check if user can remove members
    const remover = team.members.find((m) => m.userId === userId);
    if (!remover) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    const memberToRemove = team.members.find((m) => m.userId === memberIdToRemove);
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
    const now = new Date();
    const updatedMembers = team.members.filter((m) => m.userId !== memberIdToRemove);

    await adminDb.collection(TEAMS_COLLECTION).doc(teamId).update({
      members: updatedMembers.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      updatedAt: now.toISOString(),
    });

    // Remove member lookup record
    await adminDb.collection(TEAM_MEMBERS_COLLECTION).doc(`${teamId}_${memberIdToRemove}`).delete();

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
    const teamResult = await getTeam(teamId, userId);
    if (!teamResult.success || !teamResult.team) {
      return {
        success: false,
        error: teamResult.error || 'Team not found',
      };
    }

    const team = teamResult.team;

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

    const memberIndex = team.members.findIndex((m) => m.userId === memberIdToUpdate);
    if (memberIndex === -1) {
      return {
        success: false,
        error: 'Member not found',
      };
    }

    // Update member
    const now = new Date();
    const updatedMember = { ...team.members[memberIndex], role: newRole };
    team.members[memberIndex] = updatedMember;

    await adminDb.collection(TEAMS_COLLECTION).doc(teamId).update({
      members: team.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      updatedAt: now.toISOString(),
    });

    // Update member lookup record
    await adminDb
      .collection(TEAM_MEMBERS_COLLECTION)
      .doc(`${teamId}_${memberIdToUpdate}`)
      .update({ role: newRole });

    return {
      success: true,
      member: updatedMember,
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
export function getTeamMemberCount(team: Team): number {
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
export function isTeamOwner(team: Team, userId: string): boolean {
  return team.ownerId === userId;
}

/**
 * Check if user is team admin
 */
export function isTeamAdmin(team: Team, userId: string): boolean {
  const member = team.members.find((m) => m.userId === userId);
  return member?.role === 'admin' || member?.role === 'owner';
}

/**
 * Get user's role in team
 */
export function getUserTeamRole(team: Team, userId: string): TeamRole | null {
  const member = team.members.find((m) => m.userId === userId);
  return member?.role || null;
}
