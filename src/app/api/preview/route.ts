import { NextRequest, NextResponse } from 'next/server';
import { generateHtmlPreview } from '@/lib/pdf/generator';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

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
    const body = await request.json();

    if (!body.markdown || body.markdown.trim() === '') {
      return NextResponse.json(
        { error: 'Content is empty' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

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
