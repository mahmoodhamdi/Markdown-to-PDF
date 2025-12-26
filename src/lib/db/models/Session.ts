/**
 * Session Model
 * Tracks active user sessions for session management
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ISession {
  _id: string;
  userId: string;
  token: string; // Hashed JWT token identifier
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  ip?: string;
  location?: string;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    device: { type: String },
    ip: { type: String },
    location: { type: String },
    lastActive: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent model recompilation in development
export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
