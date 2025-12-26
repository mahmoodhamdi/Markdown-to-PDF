/**
 * Team Invitation Model
 * Stores pending team invitations
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type InvitationRole = 'admin' | 'member';

export interface ITeamInvitation extends Document {
  teamId: string;
  teamName: string;
  email: string;
  role: InvitationRole;
  invitedBy: string;
  inviterEmail: string;
  inviterName: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInvitationSchema = new Schema<ITeamInvitation>(
  {
    teamId: { type: String, required: true, index: true },
    teamName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    invitedBy: { type: String, required: true },
    inviterEmail: { type: String, required: true },
    inviterName: { type: String, required: true },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
    acceptedAt: { type: Date },
    declinedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
TeamInvitationSchema.index({ teamId: 1, email: 1 });
TeamInvitationSchema.index({ token: 1, status: 1 });

// Static methods
TeamInvitationSchema.statics.findValidByToken = function (token: string) {
  return this.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
};

TeamInvitationSchema.statics.findPendingByTeam = function (teamId: string) {
  return this.find({
    teamId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

TeamInvitationSchema.statics.findPendingByEmail = function (email: string) {
  return this.find({
    email: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

// Pre-save hook to ensure token is unique
TeamInvitationSchema.pre('save', function () {
  if (this.isNew && !this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
});

export interface TeamInvitationModel extends Model<ITeamInvitation> {
  findValidByToken(token: string): Promise<ITeamInvitation | null>;
  findPendingByTeam(teamId: string): Promise<ITeamInvitation[]>;
  findPendingByEmail(email: string): Promise<ITeamInvitation[]>;
}

export const TeamInvitation: TeamInvitationModel =
  (mongoose.models.TeamInvitation as TeamInvitationModel) ||
  mongoose.model<ITeamInvitation, TeamInvitationModel>('TeamInvitation', TeamInvitationSchema);
