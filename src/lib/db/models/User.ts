/**
 * User Model
 * Stores user account information and subscription details
 */

import mongoose, { Schema, Model } from 'mongoose';
import { PlanType } from '@/lib/plans/config';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  image: string;
  password?: string; // Hashed password for email/password auth
  plan: PlanType;
  usage: {
    conversions: number;
    apiCalls: number;
    lastReset: string;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true }, // Use email as _id
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, default: '' },
    image: { type: String, default: '' },
    password: { type: String }, // Hashed password for email/password auth
    emailVerified: { type: Date },
    plan: {
      type: String,
      enum: ['free', 'pro', 'team', 'enterprise'],
      default: 'free',
    },
    usage: {
      conversions: { type: Number, default: 0 },
      apiCalls: { type: Number, default: 0 },
      lastReset: { type: String, default: () => new Date().toISOString().split('T')[0] },
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
  },
  {
    _id: false, // We're using email as _id
    timestamps: true,
  }
);

// Indexes (email index already created by unique: true in schema)
UserSchema.index({ plan: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ plan: 1, createdAt: -1 }); // For admin queries by plan
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true }); // For webhook lookups

// Prevent model recompilation in development
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
