/**
 * Single File API
 * GET /api/storage/files/[fileId] - Get file details
 * DELETE /api/storage/files/[fileId] - Delete file
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getFile, deleteFile } from '@/lib/storage/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { fileId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`storage:get:${userId}`, 120, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get file
    const result = await getFile(userId, fileId);

    if (!result.success || !result.file) {
      return NextResponse.json(
        { error: result.error || 'File not found' },
        { status: result.error === 'Access denied' ? 403 : 404 }
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
        updatedAt: result.file.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get file API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { fileId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`storage:delete:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Delete file
    const result = await deleteFile(userId, fileId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
