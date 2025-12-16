import { NextRequest, NextResponse } from 'next/server';
import { generatePdfBatch } from '@/lib/pdf/generator';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { batchRequestSchema, validateRequest } from '@/lib/validations/api-schemas';
import { DocumentTheme, CodeTheme, PageSettings } from '@/types';

// Rate limit: 10 batch requests per minute (batch is heavy)
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  // Check rate limit
  const rateLimitResult = checkRateLimit(`batch:${ip}`, RATE_LIMIT, RATE_WINDOW);
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
    const validation = validateRequest(batchRequestSchema, rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const body = validation.data;

    // Use optimized batch processing with browser pool
    const results = await generatePdfBatch(
      body.files.map((file) => ({
        id: file.id,
        filename: file.filename,
        markdown: file.markdown,
      })),
      {
        theme: body.theme as DocumentTheme,
        codeTheme: body.codeTheme as CodeTheme,
        pageSettings: body.pageSettings as PageSettings,
      }
    );

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      results,
      summary: {
        total: body.files.length,
        success: successCount,
        failed: failedCount,
      },
    }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Batch convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
