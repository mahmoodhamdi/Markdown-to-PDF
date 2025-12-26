/**
 * Account Model
 * Tracks OAuth provider connections for each user
 */

import mongoose, { Schema, Model } from 'mongoose';

export type OAuthProvider = 'github' | 'google';

export interface IAccount {
  _id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  providerEmail?: string;
  providerName?: string;
  providerImage?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    provider: {
      type: String,
      enum: ['github', 'google'],
      required: true
    },
    providerAccountId: { type: String, required: true },
    providerEmail: { type: String },
    providerName: { type: String },
    providerImage: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Date },
  },
  {
    _id: false,
    timestamps: true,
  }
);

// Unique index for provider + providerAccountId
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
// Index for finding user's accounts
AccountSchema.index({ userId: 1, provider: 1 });

// Prevent model recompilation in development
export const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
