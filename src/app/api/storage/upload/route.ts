/**
 * File Upload API
 * POST /api/storage/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { uploadFile, isAllowedMimeType, getAllowedMimeTypes } from '@/lib/storage/service';
import { PlanType, getPlanLimits } from '@/lib/plans/config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userPlan = (session.user.plan as PlanType) || 'free';

    // Check rate limit
    const rateLimitResult = checkRateLimit(`storage:upload:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if storage is available for the plan
    const limits = getPlanLimits(userPlan);
    if (limits.cloudStorageBytes === 0) {
      return NextResponse.json(
        { error: 'Cloud storage is not available on your plan. Please upgrade to Pro or higher.' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed. Allowed types: ${getAllowedMimeTypes().join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const result = await uploadFile(
      userId,
      userPlan,
      buffer,
      file.name,
      file.type
    );

    if (!result.success || !result.file) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: result.file.id,
        filename: result.file.originalName,
        size: result.file.size,
        mimeType: result.file.mimeType,
        createdAt: result.file.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
