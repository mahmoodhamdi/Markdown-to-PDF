import { NextRequest, NextResponse } from 'next/server';
import { generateHtmlPreview } from '@/lib/pdf/generator';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { previewRequestSchema, validateRequest } from '@/lib/validations/api-schemas';

// Rate limit: 120 requests per minute (preview is lighter than convert)
const RATE_LIMIT = 120;
const RATE_WINDOW = 60 * 1000;

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  // Check rate limit
  const rateLimitResult = checkRateLimit(`preview:${ip}`, RATE_LIMIT, RATE_WINDOW);
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders }
    );
  }

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

    const html = await generateHtmlPreview(body.markdown, body.theme);

    return NextResponse.json({ html }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
