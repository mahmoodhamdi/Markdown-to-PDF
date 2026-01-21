/**
 * Analytics Track Event API
 * POST /api/analytics/track - Track a usage event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { trackEvent, EventType } from '@/lib/analytics/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';
import { safeMetadataSchema } from '@/lib/validations/api-schemas';

const trackEventSchema = z.object({
  eventType: z.enum([
    'conversion',
    'api_call',
    'file_upload',
    'file_download',
    'template_used',
    'batch_conversion',
  ]),
  metadata: safeMetadataSchema,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check rate limit (generous limit for tracking)
    const rateLimitResult = checkRateLimit(`analytics:track:${userId}`, 200, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = trackEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Track event
    await trackEvent(userId, validation.data.eventType as EventType, validation.data.metadata);

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Track event API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
