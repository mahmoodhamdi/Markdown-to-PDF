/**
 * Cloud Storage Service
 * Handles file upload, download, listing, and quota tracking
 */

import { adminStorage, adminDb } from '@/lib/firebase/admin';
import { getPlanLimits, PlanType } from '@/lib/plans/config';

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

export interface StorageQuota {
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
  quota?: StorageQuota;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// Collection name for file metadata
const FILES_COLLECTION = 'user_files';
const QUOTA_COLLECTION = 'storage_quota';

/**
 * Get the storage bucket
 */
function getBucket() {
  return adminStorage.bucket();
}

/**
 * Generate a unique file path for a user
 */
function generateFilePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/files/${timestamp}_${sanitizedFilename}`;
}

/**
 * Get user's storage quota information
 */
export async function getStorageQuota(
  userId: string,
  planType: PlanType
): Promise<StorageQuota> {
  const limits = getPlanLimits(planType);
  const quotaLimit = limits.cloudStorageBytes;

  // Get current usage from Firestore
  const quotaDoc = await adminDb.collection(QUOTA_COLLECTION).doc(userId).get();
  const used = quotaDoc.exists ? (quotaDoc.data()?.used || 0) : 0;

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
async function updateStorageQuota(
  userId: string,
  bytesChange: number
): Promise<void> {
  const quotaRef = adminDb.collection(QUOTA_COLLECTION).doc(userId);

  await adminDb.runTransaction(async (transaction) => {
    const quotaDoc = await transaction.get(quotaRef);
    const currentUsed = quotaDoc.exists ? (quotaDoc.data()?.used || 0) : 0;
    const newUsed = Math.max(0, currentUsed + bytesChange);

    transaction.set(
      quotaRef,
      {
        used: newUsed,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  });
}

/**
 * Upload a file to cloud storage
 */
export async function uploadFile(
  userId: string,
  planType: PlanType,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  try {
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

    const bucket = getBucket();
    const filePath = generateFilePath(userId, filename);
    const file = bucket.file(filePath);

    // Upload to Firebase Storage
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          userId,
          originalName: filename,
        },
      },
    });

    // Create file record in Firestore
    const fileId = `${userId}_${Date.now()}`;
    const now = new Date();
    const storedFile: StoredFile = {
      id: fileId,
      userId,
      filename: filePath.split('/').pop() || filename,
      originalName: filename,
      mimeType,
      size: fileSize,
      path: filePath,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(FILES_COLLECTION).doc(fileId).set({
      ...storedFile,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Update storage quota
    await updateStorageQuota(userId, fileSize);

    return {
      success: true,
      file: storedFile,
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
export async function listFiles(
  userId: string,
  planType: PlanType
): Promise<ListFilesResult> {
  try {
    const quota = await getStorageQuota(userId, planType);

    const snapshot = await adminDb
      .collection(FILES_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const files: StoredFile[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        userId: data.userId,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        path: data.path,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    });

    return {
      success: true,
      files,
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
    const doc = await adminDb.collection(FILES_COLLECTION).doc(fileId).get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    const data = doc.data();
    if (!data) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    // Verify ownership
    if (data.userId !== userId) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    return {
      success: true,
      file: {
        id: data.id,
        userId: data.userId,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        path: data.path,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
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

    const bucket = getBucket();
    const file = bucket.file(fileResult.file.path);

    // Generate signed URL valid for 1 hour
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
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

    const bucket = getBucket();
    const file = bucket.file(fileResult.file.path);
    const [buffer] = await file.download();

    return {
      success: true,
      buffer,
      file: fileResult.file,
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
export async function deleteFile(
  userId: string,
  fileId: string
): Promise<DeleteResult> {
  try {
    const fileResult = await getFile(userId, fileId);
    if (!fileResult.success || !fileResult.file) {
      return {
        success: false,
        error: fileResult.error || 'File not found',
      };
    }

    const bucket = getBucket();
    const file = bucket.file(fileResult.file.path);

    // Delete from Storage
    await file.delete();

    // Delete from Firestore
    await adminDb.collection(FILES_COLLECTION).doc(fileId).delete();

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
