import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf/generator';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

// Rate limit: 10 batch requests per minute (batch is heavy)
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

interface BatchItem {
  id: string;
  filename: string;
  markdown: string;
}

interface BatchRequest {
  files: BatchItem[];
  theme?: string;
  codeTheme?: string;
  pageSettings?: object;
}

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
    const body: BatchRequest = await request.json();

    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (body.files.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 files allowed' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const results = await Promise.all(
      body.files.map(async (file) => {
        try {
          const result = await generatePdf({
            markdown: file.markdown,
            theme: body.theme as import('@/types').DocumentTheme,
            codeTheme: body.codeTheme as import('@/types').CodeTheme,
            pageSettings: body.pageSettings as import('@/types').PageSettings,
          });

          if (result.success && result.data) {
            return {
              id: file.id,
              filename: file.filename.replace(/\.(md|markdown|txt)$/i, '.pdf'),
              success: true,
              data: Buffer.from(result.data).toString('base64'),
              fileSize: result.fileSize,
            };
          }

          return {
            id: file.id,
            filename: file.filename,
            success: false,
            error: result.error || 'Conversion failed',
          };
        } catch (error) {
          return {
            id: file.id,
            filename: file.filename,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
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
