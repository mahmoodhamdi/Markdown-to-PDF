import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf/generator';
import { convertRequestSchema, validateRequest } from '@/lib/validations/api-schemas';
import { sanitizeCss } from '@/lib/sanitize';
import {
  getRequestContext,
  checkConversionRateLimit,
  checkFileSizeLimit,
  recordConversion,
  createRateLimitErrorResponse,
  getPlanLimits,
} from '@/lib/plans';

export async function POST(request: NextRequest) {
  // Get request context (auth status, user plan, IP)
  const context = await getRequestContext(request);

  // Check conversion rate limit based on user plan
  const rateLimitResult = await checkConversionRateLimit(context);

  if (!rateLimitResult.success) {
    return createRateLimitErrorResponse(rateLimitResult);
  }

  const rateLimitHeaders = rateLimitResult.headers;

  try {
    const rawBody = await request.json();

    // Validate request body with Zod
    const validation = validateRequest(convertRequestSchema, rawBody);

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

    // Check if custom CSS is allowed for the user's plan
    if (body.customCss) {
      if (!planLimits.customCssAllowed && !context.isAuthenticated) {
        return NextResponse.json(
          { error: 'Custom CSS requires a Pro plan or higher. Please upgrade to use this feature.' },
          { status: 403, headers: rateLimitHeaders }
        );
      }
      if (planLimits.customCssAllowed) {
        body.customCss = sanitizeCss(body.customCss);
      } else {
        // Remove custom CSS for plans that don't support it
        delete body.customCss;
      }
    }

    // Check if the requested theme is available for the user's plan
    if (body.theme && !planLimits.availableThemes.includes(body.theme)) {
      return NextResponse.json(
        { error: `Theme "${body.theme}" is not available for your plan. Available themes: ${planLimits.availableThemes.join(', ')}` },
        { status: 403, headers: rateLimitHeaders }
      );
    }

    const result = await generatePdf(body);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Conversion failed' },
        { status: 500, headers: rateLimitHeaders }
      );
    }

    // Record successful conversion for usage tracking
    await recordConversion(context);

    // Convert to Uint8Array for Response compatibility
    const pdfData = Buffer.isBuffer(result.data)
      ? Uint8Array.from(result.data)
      : typeof result.data === 'string'
        ? new TextEncoder().encode(result.data)
        : result.data;

    return new Response(pdfData as BlobPart, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'Content-Length': result.fileSize?.toString() || '0',
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    console.error('Convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/convert',
    method: 'POST',
    description: 'Convert Markdown to PDF',
    parameters: {
      markdown: { type: 'string', required: true },
      theme: { type: 'string', required: false, default: 'github' },
      codeTheme: { type: 'string', required: false, default: 'github-light' },
      pageSettings: { type: 'object', required: false },
      customCss: { type: 'string', required: false },
    },
  });
}
