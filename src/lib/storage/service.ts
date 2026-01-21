/**
 * Cloud Storage Service
 * Handles file upload, download, listing, and quota tracking
 * Uses MongoDB for metadata and Cloudinary for file storage
 */

import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from '@/lib/db/mongodb';
import { UserFile, StorageQuota } from '@/lib/db/models/UserFile';
import { getPlanLimits, PlanType } from '@/lib/plans/config';
import { sanitizeFilename } from '@/lib/sanitize';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface StoredFile {
  id: string;
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

export interface StorageQuotaData {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  file?: StoredFile;
  error?: string;
}

export interface ListFilesResult {
  success: boolean;
  files?: StoredFile[];
  quota?: StorageQuotaData;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Get user's storage quota information
 */
export async function getStorageQuota(
  userId: string,
  planType: PlanType
): Promise<StorageQuotaData> {
  await connectDB();

  const limits = getPlanLimits(planType);
  const quotaLimit = limits.cloudStorageBytes;

  // Get current usage from MongoDB (lean for faster read-only)
  const quota = await StorageQuota.findOne({ userId }).lean();
  const used = quota?.used || 0;

  // Handle Infinity for enterprise plans
  const remaining = quotaLimit === Infinity ? Infinity : Math.max(0, quotaLimit - used);
  const percentage = quotaLimit === Infinity ? 0 : Math.min(100, (used / quotaLimit) * 100);

  return {
    used,
    limit: quotaLimit,
    remaining,
    percentage,
  };
}

/**
 * Update user's storage quota
 */
async function updateStorageQuota(userId: string, bytesChange: number): Promise<void> {
  await connectDB();

  await StorageQuota.findOneAndUpdate(
    { userId },
    {
      $inc: { used: bytesChange },
      $setOnInsert: { userId },
    },
    { upsert: true, new: true }
  );

  // Ensure used doesn't go negative
  await StorageQuota.updateOne({ userId, used: { $lt: 0 } }, { $set: { used: 0 } });
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadFile(
  userId: string,
  planType: PlanType,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    await connectDB();

    // Check storage quota
    const quota = await getStorageQuota(userId, planType);
    const fileSize = fileBuffer.length;

    if (quota.limit === 0) {
      return {
        success: false,
        error: 'Cloud storage is not available on your plan',
      };
    }

    if (quota.remaining !== Infinity && fileSize > quota.remaining) {
      return {
        success: false,
        error: `Insufficient storage. You have ${formatBytes(quota.remaining)} remaining.`,
      };
    }

    // Check file size limit per plan
    const limits = getPlanLimits(planType);
    if (fileSize > limits.maxFileSize) {
      return {
        success: false,
        error: `File size exceeds limit of ${formatBytes(limits.maxFileSize)}`,
      };
    }

    // Determine resource type based on MIME type
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

    // Sanitize filename for safe storage
    const safeFilename = sanitizeFilename(filename);

    // Upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `md2pdf/users/${userId}`,
            public_id: `${Date.now()}_${safeFilename}`,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error('Upload failed'));
          }
        );
        uploadStream.end(fileBuffer);
      }
    );

    // Create file record in MongoDB
    const userFile = await UserFile.create({
      userId,
      filename: uploadResult.public_id.split('/').pop() || filename,
      originalName: filename,
      mimeType,
      size: fileSize,
      path: uploadResult.public_id,
      url: uploadResult.secure_url,
    });

    // Update storage quota
    await updateStorageQuota(userId, fileSize);

    return {
      success: true,
      file: {
        id: userFile._id.toString(),
        userId: userFile.userId,
        filename: userFile.filename,
        originalName: userFile.originalName,
        mimeType: userFile.mimeType,
        size: userFile.size,
        path: userFile.path,
        url: userFile.url,
        createdAt: userFile.createdAt,
        updatedAt: userFile.updatedAt,
      },
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * List all files for a user
 */
export async function listFiles(userId: string, planType: PlanType): Promise<ListFilesResult> {
  try {
    await connectDB();

    const quota = await getStorageQuota(userId, planType);

    // Use lean() for faster read-only query
    const files = await UserFile.find({ userId }).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      files: files.map((f) => ({
        id: f._id.toString(),
        userId: f.userId,
        filename: f.filename,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        path: f.path,
        url: f.url,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      quota,
    };
  } catch (error) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}

/**
 * Get a file by ID
 */
export async function getFile(
  userId: string,
  fileId: string
): Promise<{ success: boolean; file?: StoredFile; error?: string }> {
  try {
    await connectDB();

    // Use lean() for faster read-only query
    const file = await UserFile.findById(fileId).lean();

    if (!file) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    // Verify ownership
    if (file.userId !== userId) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    return {
      success: true,
      file: {
        id: file._id.toString(),
        userId: file.userId,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
    };
  } catch (error) {
    console.error('Get file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file',
    };
  }
}

/**
 * Get a signed URL for downloading a file
 */
export async function getDownloadUrl(
  userId: string,
  fileId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileResult = await getFile(userId, fileId);
    if (!fileResult.success || !fileResult.file) {
      return {
        success: false,
        error: fileResult.error || 'File not found',
      };
    }

    // For Cloudinary, we can generate a signed URL or just use the stored URL
    // The stored URL is already accessible
    if (fileResult.file.url) {
      return {
        success: true,
        url: fileResult.file.url,
      };
    }

    // Generate a signed URL for raw files (valid for 1 hour)
    const url = cloudinary.url(fileResult.file.path, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Get download URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL',
    };
  }
}

/**
 * Download file content
 */
export async function downloadFile(
  userId: string,
  fileId: string
): Promise<{ success: boolean; buffer?: Buffer; file?: StoredFile; error?: string }> {
  try {
    const fileResult = await getFile(userId, fileId);
    if (!fileResult.success || !fileResult.file) {
      return {
        success: false,
        error: fileResult.error || 'File not found',
      };
    }

    // Fetch file from Cloudinary URL
    if (fileResult.file.url) {
      const response = await fetch(fileResult.file.url);
      if (!response.ok) {
        throw new Error('Failed to download from Cloudinary');
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        buffer,
        file: fileResult.file,
      };
    }

    return {
      success: false,
      error: 'File URL not available',
    };
  } catch (error) {
    console.error('Download file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download file',
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(userId: string, fileId: string): Promise<DeleteResult> {
  try {
    await connectDB();

    const fileResult = await getFile(userId, fileId);
    if (!fileResult.success || !fileResult.file) {
      return {
        success: false,
        error: fileResult.error || 'File not found',
      };
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(fileResult.file.path, {
        resource_type: fileResult.file.mimeType.startsWith('image/') ? 'image' : 'raw',
      });
    } catch (cloudinaryError) {
      console.warn('Cloudinary delete warning:', cloudinaryError);
      // Continue even if Cloudinary delete fails
    }

    // Delete from MongoDB
    await UserFile.findByIdAndDelete(fileId);

    // Update storage quota
    await updateStorageQuota(userId, -fileResult.file.size);

    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === Infinity) return 'Unlimited';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get allowed MIME types for upload
 */
export function getAllowedMimeTypes(): string[] {
  return [
    'text/markdown',
    'text/plain',
    'text/html',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'application/json',
  ];
}

/**
 * Validate if a MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return getAllowedMimeTypes().includes(mimeType);
}
