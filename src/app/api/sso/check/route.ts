/**
 * SSO Check API
 * POST /api/sso/check - Check if email should use SSO
 */

import { NextRequest, NextResponse } from 'next/server';
import { shouldUseSSO } from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

const checkSSOSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (anonymous access allowed but rate limited)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`sso:check:${ip}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = checkSSOSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if email should use SSO
    const result = await shouldUseSSO(email);

    if (result.useSSO && result.ssoConfig) {
      return NextResponse.json({
        success: true,
        useSSO: true,
        enforced: result.enforced,
        provider: result.ssoConfig.provider,
        organizationId: result.ssoConfig.organizationId,
        // Only return limited info for security
        ssoUrl: `/api/sso/login?email=${encodeURIComponent(email)}`,
      });
    }

    return NextResponse.json({
      success: true,
      useSSO: false,
      enforced: false,
    });
  } catch (error) {
    console.error('SSO check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
