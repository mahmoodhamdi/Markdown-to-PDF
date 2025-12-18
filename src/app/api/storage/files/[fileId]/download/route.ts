/**
 * File Download API
 * GET /api/storage/files/[fileId]/download - Download file content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { downloadFile, getDownloadUrl } from '@/lib/storage/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const { fileId } = await params;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`storage:download:${userId}`, 60, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if URL-only mode is requested
    const urlOnly = request.nextUrl.searchParams.get('urlOnly') === 'true';

    if (urlOnly) {
      // Return signed URL
      const result = await getDownloadUrl(userId, fileId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === 'Access denied' ? 403 : 404 }
        );
      }

      return NextResponse.json({
        success: true,
        url: result.url,
      });
    }

    // Download file content
    const result = await downloadFile(userId, fileId);

    if (!result.success || !result.buffer || !result.file) {
      return NextResponse.json(
        { error: result.error || 'Download failed' },
        { status: result.error === 'Access denied' ? 403 : 404 }
      );
    }

    // Return file as binary response (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(result.file.originalName)}"`,
        'Content-Length': result.buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download file API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
