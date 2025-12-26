/**
 * Team Activity Model
 * Stores team activity logs for auditing and transparency
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type TeamActivityAction =
  | 'team_created'
  | 'team_deleted'
  | 'team_updated'
  | 'member_invited'
  | 'member_joined'
  | 'member_removed'
  | 'member_left'
  | 'role_changed'
  | 'settings_updated'
  | 'invitation_canceled'
  | 'invitation_resent';

export interface ITeamActivity extends Document {
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: TeamActivityAction;
  details: Record<string, unknown>;
  createdAt: Date;
}

const TeamActivitySchema = new Schema<ITeamActivity>(
  {
    teamId: { type: String, required: true, index: true },
    teamName: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    action: {
      type: String,
      enum: [
        'team_created',
        'team_deleted',
        'team_updated',
        'member_invited',
        'member_joined',
        'member_removed',
        'member_left',
        'role_changed',
        'settings_updated',
        'invitation_canceled',
        'invitation_resent',
      ],
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
TeamActivitySchema.index({ teamId: 1, createdAt: -1 });
TeamActivitySchema.index({ teamId: 1, action: 1, createdAt: -1 });

// Static methods
TeamActivitySchema.statics.getTeamActivities = function (
  teamId: string,
  options: { action?: TeamActivityAction; limit?: number; skip?: number } = {}
) {
  const query: Record<string, unknown> = { teamId };
  if (options.action) {
    query.action = options.action;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

export interface TeamActivityModel extends Model<ITeamActivity> {
  getTeamActivities(
    teamId: string,
    options?: { action?: TeamActivityAction; limit?: number; skip?: number }
  ): Promise<ITeamActivity[]>;
}

export const TeamActivity: TeamActivityModel =
  (mongoose.models.TeamActivity as TeamActivityModel) ||
  mongoose.model<ITeamActivity, TeamActivityModel>('TeamActivity', TeamActivitySchema);
