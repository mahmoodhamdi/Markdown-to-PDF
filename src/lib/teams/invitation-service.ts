/**
 * Team Invitation Service
 * Handles team invitation creation, acceptance, and management
 */

import { connectDB } from '@/lib/db/mongodb';
import { Team, TeamMemberLookup, type ITeamMember, type TeamRole } from '@/lib/db/models/Team';
import {
  TeamInvitation,
  type ITeamInvitation,
  type InvitationRole,
} from '@/lib/db/models/TeamInvitation';
import { getPlanLimits } from '@/lib/plans/config';
import { emailService } from '@/lib/email/service';
import {
  logMemberInvited,
  logMemberJoined,
  logInvitationCanceled,
  logInvitationResent,
} from './activity-service';
import crypto from 'crypto';

export interface CreateInvitationInput {
  teamId: string;
  email: string;
  role?: InvitationRole;
  invitedBy: string;
  inviterEmail: string;
  inviterName: string;
}

export interface InvitationData {
  id: string;
  teamId: string;
  teamName: string;
  email: string;
  role: InvitationRole;
  invitedBy: string;
  inviterEmail: string;
  inviterName: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface InvitationResult {
  success: boolean;
  invitation?: InvitationData;
  error?: string;
}

export interface InvitationListResult {
  success: boolean;
  invitations?: InvitationData[];
  error?: string;
}

function toInvitationData(doc: ITeamInvitation): InvitationData {
  return {
    id: doc._id.toString(),
    teamId: doc.teamId,
    teamName: doc.teamName,
    email: doc.email,
    role: doc.role,
    invitedBy: doc.invitedBy,
    inviterEmail: doc.inviterEmail,
    inviterName: doc.inviterName,
    status: doc.status,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

/**
 * Create a team invitation
 */
export async function createInvitation(input: CreateInvitationInput): Promise<InvitationResult> {
  try {
    await connectDB();

    const team = await Team.findById(input.teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check if inviter has permission
    const inviter = team.members.find((m: ITeamMember) => m.userId === input.invitedBy);
    if (!inviter) {
      return { success: false, error: 'Access denied' };
    }

    const canInvite =
      inviter.role === 'owner' ||
      inviter.role === 'admin' ||
      (team.settings.allowMemberInvites && inviter.role === 'member');

    if (!canInvite) {
      return { success: false, error: 'You do not have permission to invite members' };
    }

    // Check member limit
    const limits = getPlanLimits(team.plan);
    const currentMemberCount = team.members.length;
    const pendingInvitations = await TeamInvitation.countDocuments({
      teamId: input.teamId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (
      limits.teamMembersAllowed !== Infinity &&
      currentMemberCount + pendingInvitations >= limits.teamMembersAllowed
    ) {
      return {
        success: false,
        error: `Team member limit reached (${limits.teamMembersAllowed} members)`,
      };
    }

    // Check if already a member
    const existingMember = team.members.find(
      (m: ITeamMember) => m.email.toLowerCase() === input.email.toLowerCase()
    );
    if (existingMember) {
      return { success: false, error: 'User is already a team member' };
    }

    // Check for existing pending invitation
    const existingInvitation = await TeamInvitation.findOne({
      teamId: input.teamId,
      email: input.email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return { success: false, error: 'An invitation has already been sent to this email' };
    }

    // Determine role (only owner can invite as admin)
    const role =
      input.role === 'admin' && inviter.role !== 'owner' ? 'member' : input.role || 'member';

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await TeamInvitation.create({
      teamId: input.teamId,
      teamName: team.name,
      email: input.email.toLowerCase(),
      role,
      invitedBy: input.invitedBy,
      inviterEmail: input.inviterEmail,
      inviterName: input.inviterName,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send invitation email
    await emailService.sendTeamInvitation({
      recipientEmail: input.email,
      teamName: team.name,
      teamId: input.teamId,
      inviterName: input.inviterName,
      inviterEmail: input.inviterEmail,
      role,
      invitationToken: token,
    });

    // Log activity
    await logMemberInvited(
      input.teamId,
      team.name,
      input.invitedBy,
      input.inviterEmail,
      input.inviterName,
      input.email,
      role
    );

    return {
      success: true,
      invitation: toInvitationData(invitation),
    };
  } catch (error) {
    console.error('Create invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invitation',
    };
  }
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<InvitationResult> {
  try {
    await connectDB();

    const invitation = await TeamInvitation.findOne({ token });

    if (!invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    // Check if expired
    if (invitation.expiresAt < new Date() && invitation.status === 'pending') {
      await TeamInvitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return { success: false, error: 'Invitation has expired' };
    }

    return {
      success: true,
      invitation: toInvitationData(invitation),
    };
  } catch (error) {
    console.error('Get invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invitation',
    };
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  token: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<{ success: boolean; teamId?: string; error?: string }> {
  try {
    await connectDB();

    const invitation = await TeamInvitation.findOne({
      token,
      status: 'pending',
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found or already used' };
    }

    if (invitation.expiresAt < new Date()) {
      await TeamInvitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return { success: false, error: 'Invitation has expired' };
    }

    // Verify email matches (case insensitive)
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { success: false, error: 'This invitation was sent to a different email address' };
    }

    // Get team
    const team = await Team.findById(invitation.teamId);
    if (!team) {
      return { success: false, error: 'Team no longer exists' };
    }

    // Check if already a member
    const existingMember = team.members.find((m: ITeamMember) => m.userId === userId);
    if (existingMember) {
      // Update invitation status
      await TeamInvitation.findByIdAndUpdate(invitation._id, {
        status: 'accepted',
        acceptedAt: new Date(),
      });
      return { success: true, teamId: invitation.teamId };
    }

    // Check member limit
    const limits = getPlanLimits(team.plan);
    if (
      limits.teamMembersAllowed !== Infinity &&
      team.members.length >= limits.teamMembersAllowed
    ) {
      return { success: false, error: 'Team member limit reached' };
    }

    // Add to team
    const now = new Date();
    const newMember: ITeamMember = {
      userId,
      email: userEmail,
      name: userName,
      role: invitation.role as TeamRole,
      joinedAt: now,
      invitedBy: invitation.invitedBy,
    };

    await Team.findByIdAndUpdate(invitation.teamId, {
      $push: { members: newMember },
    });

    // Add member lookup
    await TeamMemberLookup.create({
      teamId: invitation.teamId,
      userId,
      email: userEmail,
      role: invitation.role,
      joinedAt: now,
      invitedBy: invitation.invitedBy,
      status: 'active',
    });

    // Update invitation status
    await TeamInvitation.findByIdAndUpdate(invitation._id, {
      status: 'accepted',
      acceptedAt: now,
    });

    // Log activity
    await logMemberJoined(invitation.teamId, invitation.teamName, userId, userEmail, userName);

    return { success: true, teamId: invitation.teamId };
  } catch (error) {
    console.error('Accept invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitation',
    };
  }
}

/**
 * Decline an invitation
 */
export async function declineInvitation(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const invitation = await TeamInvitation.findOne({
      token,
      status: 'pending',
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found or already processed' };
    }

    await TeamInvitation.findByIdAndUpdate(invitation._id, {
      status: 'declined',
      declinedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Decline invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decline invitation',
    };
  }
}

/**
 * Get pending invitations for a team
 */
export async function getTeamInvitations(
  teamId: string,
  userId: string
): Promise<InvitationListResult> {
  try {
    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check if user is a member
    const isMember = team.members.some((m: ITeamMember) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'Access denied' };
    }

    const invitations = await TeamInvitation.find({
      teamId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return {
      success: true,
      invitations: invitations.map(toInvitationData),
    };
  } catch (error) {
    console.error('Get team invitations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invitations',
    };
  }
}

/**
 * Get pending invitations for a user (by email)
 */
export async function getUserInvitations(email: string): Promise<InvitationListResult> {
  try {
    await connectDB();

    const invitations = await TeamInvitation.find({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return {
      success: true,
      invitations: invitations.map(toInvitationData),
    };
  } catch (error) {
    console.error('Get user invitations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invitations',
    };
  }
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(
  invitationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const invitation = await TeamInvitation.findById(invitationId);
    if (!invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation is no longer pending' };
    }

    const team = await Team.findById(invitation.teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check permission (owner, admin, or the person who invited)
    const member = team.members.find((m: ITeamMember) => m.userId === userId);
    if (!member) {
      return { success: false, error: 'Access denied' };
    }

    const canCancel =
      member.role === 'owner' || member.role === 'admin' || invitation.invitedBy === userId;

    if (!canCancel) {
      return { success: false, error: 'You do not have permission to cancel this invitation' };
    }

    // Log activity before deleting
    await logInvitationCanceled(
      invitation.teamId,
      invitation.teamName,
      userId,
      member.email,
      member.name,
      invitation.email
    );

    await TeamInvitation.findByIdAndDelete(invitationId);

    return { success: true };
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel invitation',
    };
  }
}

/**
 * Resend an invitation email
 */
export async function resendInvitation(
  invitationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const invitation = await TeamInvitation.findById(invitationId);
    if (!invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation is no longer pending' };
    }

    const team = await Team.findById(invitation.teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check permission
    const member = team.members.find((m: ITeamMember) => m.userId === userId);
    if (!member) {
      return { success: false, error: 'Access denied' };
    }

    const canResend =
      member.role === 'owner' || member.role === 'admin' || invitation.invitedBy === userId;

    if (!canResend) {
      return { success: false, error: 'You do not have permission to resend this invitation' };
    }

    // Update expiration and generate new token
    const newToken = crypto.randomBytes(32).toString('hex');
    await TeamInvitation.findByIdAndUpdate(invitationId, {
      token: newToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Send email
    await emailService.sendTeamInvitation({
      recipientEmail: invitation.email,
      teamName: invitation.teamName,
      teamId: invitation.teamId,
      inviterName: invitation.inviterName,
      inviterEmail: invitation.inviterEmail,
      role: invitation.role,
      invitationToken: newToken,
    });

    // Log activity
    await logInvitationResent(
      invitation.teamId,
      invitation.teamName,
      userId,
      member.email,
      member.name,
      invitation.email
    );

    return { success: true };
  } catch (error) {
    console.error('Resend invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend invitation',
    };
  }
}
