/**
 * Team Model
 * Stores team information and members
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { PlanType } from '@/lib/plans/config';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface ITeamMember {
  userId: string;
  email: string;
  name?: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy?: string;
}

export interface ITeamSettings {
  allowMemberInvites: boolean;
  defaultMemberRole: TeamRole;
  sharedStorageEnabled: boolean;
  sharedTemplatesEnabled: boolean;
}

export interface ITeam extends Document {
  name: string;
  ownerId: string;
  ownerEmail: string;
  plan: PlanType;
  members: ITeamMember[];
  settings: ITeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    name: { type: String },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: String },
  },
  { _id: false }
);

const TeamSettingsSchema = new Schema<ITeamSettings>(
  {
    allowMemberInvites: { type: Boolean, default: false },
    defaultMemberRole: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    sharedStorageEnabled: { type: Boolean, default: true },
    sharedTemplatesEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    ownerId: { type: String, required: true },
    ownerEmail: { type: String, required: true, lowercase: true },
    plan: {
      type: String,
      enum: ['free', 'pro', 'team', 'enterprise'],
      default: 'team',
    },
    members: [TeamMemberSchema],
    settings: {
      type: TeamSettingsSchema,
      default: () => ({
        allowMemberInvites: false,
        defaultMemberRole: 'member',
        sharedStorageEnabled: true,
        sharedTemplatesEnabled: true,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TeamSchema.index({ ownerId: 1 });
TeamSchema.index({ 'members.userId': 1 });
TeamSchema.index({ 'members.email': 1 });

export const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

// TeamMember lookup collection for efficient queries
export interface ITeamMemberLookup extends Document {
  teamId: string;
  userId: string;
  email: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy?: string;
  status: 'active' | 'pending';
}

const TeamMemberLookupSchema = new Schema<ITeamMemberLookup>(
  {
    teamId: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: String },
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

TeamMemberLookupSchema.index({ teamId: 1, userId: 1 }, { unique: true });
TeamMemberLookupSchema.index({ userId: 1 });
TeamMemberLookupSchema.index({ email: 1 });

export const TeamMemberLookup: Model<ITeamMemberLookup> =
  mongoose.models.TeamMemberLookup ||
  mongoose.model<ITeamMemberLookup>('TeamMemberLookup', TeamMemberLookupSchema);
