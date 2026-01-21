/**
 * UserFile Model
 * Stores file metadata for cloud storage
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserFile extends Document {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserFileSchema = new Schema<IUserFile>(
  {
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    url: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserFileSchema.index({ userId: 1, createdAt: -1 });

export const UserFile: Model<IUserFile> =
  mongoose.models.UserFile || mongoose.model<IUserFile>('UserFile', UserFileSchema);

// Storage Quota Model
export interface IStorageQuota extends Document {
  userId: string;
  used: number;
  updatedAt: Date;
}

const StorageQuotaSchema = new Schema<IStorageQuota>(
  {
    userId: { type: String, required: true, unique: true },
    used: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const StorageQuota: Model<IStorageQuota> =
  mongoose.models.StorageQuota || mongoose.model<IStorageQuota>('StorageQuota', StorageQuotaSchema);
