import { NextRequest, NextResponse } from 'next/server';
import { generateHtmlPreview } from '@/lib/pdf/generator';
import { previewRequestSchema, validateRequest } from '@/lib/validations/api-schemas';
import {
  getRequestContext,
  checkApiRateLimit,
  checkFileSizeLimit,
  recordApiCall,
  createRateLimitErrorResponse,
  getPlanLimits,
} from '@/lib/plans';

export async function POST(request: NextRequest) {
  // Get request context (auth status, user plan, IP)
  const context = await getRequestContext(request);

  // Check API rate limit based on user plan (with preview permission for API keys)
  const rateLimitResult = await checkApiRateLimit(context, 'preview');

  if (!rateLimitResult.success) {
    return createRateLimitErrorResponse(rateLimitResult);
  }

  const rateLimitHeaders = rateLimitResult.headers;

  try {
    const rawBody = await request.json();

    // Validate request body with Zod
    const validation = validateRequest(previewRequestSchema, rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const body = validation.data;

    // Check file size limit based on plan
    const contentSize = new TextEncoder().encode(body.markdown).length;
    const fileSizeCheck = checkFileSizeLimit(contentSize, context);

    if (!fileSizeCheck.success) {
      return createRateLimitErrorResponse(fileSizeCheck);
    }

    // Get plan limits for feature gating
    const planLimits = getPlanLimits(context.userPlan);

    // Check if the requested theme is available for the user's plan
    if (body.theme && !planLimits.availableThemes.includes(body.theme)) {
      return NextResponse.json(
        {
          error: `Theme "${body.theme}" is not available for your plan. Available themes: ${planLimits.availableThemes.join(', ')}`,
        },
        { status: 403, headers: rateLimitHeaders }
      );
    }

    const html = await generateHtmlPreview(body.markdown, body.theme);

    // Record API call for usage tracking
    await recordApiCall(context);

    return NextResponse.json({ html }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
