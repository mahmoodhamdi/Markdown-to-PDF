import { NextRequest, NextResponse } from 'next/server';
import { generatePdfBatch } from '@/lib/pdf/generator';
import { batchRequestSchema, validateRequest } from '@/lib/validations/api-schemas';
import { DocumentTheme, CodeTheme, PageSettings } from '@/types';
import {
  getRequestContext,
  checkConversionRateLimit,
  checkBatchCountLimit,
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
    const validation = validateRequest(batchRequestSchema, rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const body = validation.data;

    // Check batch file count limit based on plan
    const batchCountCheck = checkBatchCountLimit(body.files.length, context);

    if (!batchCountCheck.success) {
      return createRateLimitErrorResponse(batchCountCheck);
    }

    // Get plan limits for feature gating
    const planLimits = getPlanLimits(context.userPlan);

    // Check if the requested theme is available for the user's plan
    if (body.theme && !planLimits.availableThemes.includes(body.theme)) {
      return NextResponse.json(
        { error: `Theme "${body.theme}" is not available for your plan. Available themes: ${planLimits.availableThemes.join(', ')}` },
        { status: 403, headers: rateLimitHeaders }
      );
    }

    // Check file sizes for all files
    for (const file of body.files) {
      const fileSize = new TextEncoder().encode(file.markdown).length;
      const fileSizeCheck = checkFileSizeLimit(fileSize, context);

      if (!fileSizeCheck.success) {
        return NextResponse.json(
          { error: `File "${file.filename}" exceeds size limit: ${fileSizeCheck.error}` },
          { status: 413, headers: rateLimitHeaders }
        );
      }
    }

    // Prepare page settings with watermark for free plan users
    let pageSettings = body.pageSettings as PageSettings;
    if (planLimits.hasWatermark && planLimits.watermarkText) {
      pageSettings = {
        ...pageSettings,
        watermark: {
          show: true,
          text: planLimits.watermarkText,
          opacity: 0.08,
        },
      };
    }

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
        pageSettings,
      }
    );

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // Record successful conversions for usage tracking
    if (successCount > 0) {
      await recordConversion(context);
      // Note: We count batch as 1 conversion operation, not per file
      // This is more user-friendly for batch operations
    }

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
