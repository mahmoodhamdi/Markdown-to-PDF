/**
 * Plan-based rate limiting for authenticated users
 * Supports both session-based and API key authentication
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkConversionLimit,
  checkApiCallLimit,
  incrementConversions,
  incrementApiCalls,
} from './usage';
import { getPlanLimits, PlanType } from './config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import {
  authenticateApiKey,
  checkApiKeyRateLimit,
  type ApiKeyUser,
} from '@/lib/auth/api-key-auth';

// Anonymous user limits (stricter than free plan)
const ANONYMOUS_LIMITS = {
  conversionsPerDay: 5,
  apiCallsPerDay: 20,
  maxFileSize: 100 * 1024, // 100 KB
  maxBatchFiles: 2,
};

export interface RateLimitContext {
  isAuthenticated: boolean;
  userEmail: string | null;
  userPlan: PlanType;
  ip: string;
  // API key specific fields
  authType: 'session' | 'api-key' | 'anonymous';
  apiKeyUser?: ApiKeyUser;
}

export interface RateLimitResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  headers: Record<string, string>;
  context: RateLimitContext;
}

/**
 * Get request context including authentication status
 * Supports both session-based and API key authentication
 * API key auth takes precedence when present
 */
export async function getRequestContext(
  request: NextRequest
): Promise<RateLimitContext> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  // Try API key authentication first
  const apiKeyResult = await authenticateApiKey(request);

  if (apiKeyResult?.success && apiKeyResult.user) {
    return {
      isAuthenticated: true,
      userEmail: apiKeyResult.user.email,
      userPlan: apiKeyResult.user.plan,
      ip,
      authType: 'api-key',
      apiKeyUser: apiKeyResult.user,
    };
  }

  // Fall back to session authentication
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    return {
      isAuthenticated: true,
      userEmail: session.user.email,
      userPlan: session.user.plan || 'free',
      ip,
      authType: 'session',
    };
  }

  return {
    isAuthenticated: false,
    userEmail: null,
    userPlan: 'free',
    ip,
    authType: 'anonymous',
  };
}

/**
 * Check rate limit for conversion operations
 */
export async function checkConversionRateLimit(
  context: RateLimitContext
): Promise<RateLimitResult> {
  const headers: Record<string, string> = {};

  if (!context.isAuthenticated || !context.userEmail) {
    // Anonymous user - use IP-based rate limiting
    const result = checkRateLimit(
      `convert:anon:${context.ip}`,
      ANONYMOUS_LIMITS.conversionsPerDay,
      24 * 60 * 60 * 1000 // 24 hours
    );

    const rateLimitHeaders = getRateLimitHeaders(result);

    if (!result.success) {
      return {
        success: false,
        error: 'Daily conversion limit reached. Sign up for more conversions.',
        statusCode: 429,
        headers: rateLimitHeaders,
        context,
      };
    }

    return {
      success: true,
      headers: rateLimitHeaders,
      context,
    };
  }

  // API key authentication - use API key rate limits and check permission
  if (context.authType === 'api-key' && context.apiKeyUser) {
    // Check permission
    if (!context.apiKeyUser.permissions.includes('convert')) {
      return {
        success: false,
        error: "API key lacks 'convert' permission",
        statusCode: 403,
        headers: {},
        context,
      };
    }

    // Use API key's specific rate limit
    const rateLimitResult = await checkApiKeyRateLimit(context.apiKeyUser);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error,
        statusCode: 429,
        headers: rateLimitResult.headers,
        context,
      };
    }

    return {
      success: true,
      headers: rateLimitResult.headers,
      context,
    };
  }

  // Session authenticated user - use plan-based limits
  const limitCheck = await checkConversionLimit(
    context.userEmail,
    context.userPlan
  );

  headers['X-RateLimit-Limit'] = limitCheck.limit.toString();
  headers['X-RateLimit-Remaining'] = limitCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = limitCheck.resetAt;

  if (!limitCheck.allowed) {
    const limits = getPlanLimits(context.userPlan);
    const upgradeMessage =
      context.userPlan === 'free'
        ? ' Upgrade to Pro for 500 daily conversions.'
        : context.userPlan === 'pro'
          ? ' Upgrade to Team for unlimited conversions.'
          : '';

    return {
      success: false,
      error: `Daily conversion limit of ${limits.conversionsPerDay} reached.${upgradeMessage}`,
      statusCode: 429,
      headers,
      context,
    };
  }

  return {
    success: true,
    headers,
    context,
  };
}

/**
 * Check rate limit for API calls (preview, templates, themes)
 */
export async function checkApiRateLimit(
  context: RateLimitContext,
  requiredPermission?: 'preview' | 'templates' | 'themes' | 'batch'
): Promise<RateLimitResult> {
  const headers: Record<string, string> = {};

  if (!context.isAuthenticated || !context.userEmail) {
    // Anonymous user - use IP-based rate limiting
    const result = checkRateLimit(
      `api:anon:${context.ip}`,
      ANONYMOUS_LIMITS.apiCallsPerDay,
      24 * 60 * 60 * 1000 // 24 hours
    );

    const rateLimitHeaders = getRateLimitHeaders(result);

    if (!result.success) {
      return {
        success: false,
        error: 'Daily API limit reached. Sign up for more API calls.',
        statusCode: 429,
        headers: rateLimitHeaders,
        context,
      };
    }

    return {
      success: true,
      headers: rateLimitHeaders,
      context,
    };
  }

  // API key authentication - use API key rate limits and check permission
  if (context.authType === 'api-key' && context.apiKeyUser) {
    // Check permission if required
    if (requiredPermission && !context.apiKeyUser.permissions.includes(requiredPermission)) {
      return {
        success: false,
        error: `API key lacks '${requiredPermission}' permission`,
        statusCode: 403,
        headers: {},
        context,
      };
    }

    // Use API key's specific rate limit
    const rateLimitResult = await checkApiKeyRateLimit(context.apiKeyUser);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error,
        statusCode: 429,
        headers: rateLimitResult.headers,
        context,
      };
    }

    return {
      success: true,
      headers: rateLimitResult.headers,
      context,
    };
  }

  // Session authenticated user - use plan-based limits
  const limitCheck = await checkApiCallLimit(context.userEmail, context.userPlan);

  headers['X-RateLimit-Limit'] = limitCheck.limit.toString();
  headers['X-RateLimit-Remaining'] = limitCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = limitCheck.resetAt;

  if (!limitCheck.allowed) {
    const limits = getPlanLimits(context.userPlan);
    const upgradeMessage =
      context.userPlan === 'free'
        ? ' Upgrade to Pro for 2,000 daily API calls.'
        : context.userPlan === 'pro'
          ? ' Upgrade to Team for 10,000 daily API calls.'
          : '';

    return {
      success: false,
      error: `Daily API limit of ${limits.apiCallsPerDay} reached.${upgradeMessage}`,
      statusCode: 429,
      headers,
      context,
    };
  }

  return {
    success: true,
    headers,
    context,
  };
}

/**
 * Check file size limit
 */
export function checkFileSizeLimit(
  fileSize: number,
  context: RateLimitContext
): RateLimitResult {
  const maxSize = context.isAuthenticated
    ? getPlanLimits(context.userPlan).maxFileSize
    : ANONYMOUS_LIMITS.maxFileSize;

  if (fileSize > maxSize) {
    const maxSizeKB = Math.round(maxSize / 1024);
    const currentSizeKB = Math.round(fileSize / 1024);
    const upgradeMessage = !context.isAuthenticated
      ? ' Sign up for larger file support.'
      : context.userPlan === 'free'
        ? ' Upgrade to Pro for 5 MB file support.'
        : '';

    return {
      success: false,
      error: `File size (${currentSizeKB} KB) exceeds limit (${maxSizeKB} KB).${upgradeMessage}`,
      statusCode: 413,
      headers: {},
      context,
    };
  }

  return {
    success: true,
    headers: {},
    context,
  };
}

/**
 * Check batch file count limit
 */
export function checkBatchCountLimit(
  fileCount: number,
  context: RateLimitContext
): RateLimitResult {
  const maxFiles = context.isAuthenticated
    ? getPlanLimits(context.userPlan).maxBatchFiles
    : ANONYMOUS_LIMITS.maxBatchFiles;

  if (fileCount > maxFiles) {
    const upgradeMessage = !context.isAuthenticated
      ? ' Sign up for larger batch support.'
      : context.userPlan === 'free'
        ? ' Upgrade to Pro for 50 files per batch.'
        : '';

    return {
      success: false,
      error: `Batch size (${fileCount} files) exceeds limit (${maxFiles} files).${upgradeMessage}`,
      statusCode: 413,
      headers: {},
      context,
    };
  }

  return {
    success: true,
    headers: {},
    context,
  };
}

/**
 * Record a successful conversion
 */
export async function recordConversion(context: RateLimitContext): Promise<void> {
  if (context.isAuthenticated && context.userEmail) {
    await incrementConversions(context.userEmail);
  }
}

/**
 * Record a successful API call
 */
export async function recordApiCall(context: RateLimitContext): Promise<void> {
  if (context.isAuthenticated && context.userEmail) {
    await incrementApiCalls(context.userEmail);
  }
}

/**
 * Create error response for rate limit failures
 */
export function createRateLimitErrorResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.statusCode || 429, headers: result.headers }
  );
}
