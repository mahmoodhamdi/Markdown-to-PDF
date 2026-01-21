/**
 * Rate Limit Middleware
 * Helper functions for applying rate limits to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getRateLimitConfig } from './config';
import { checkRateLimit, getRateLimitHeaders, RateLimitResult } from './redis';

/**
 * Get IP address from request
 */
export function getIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Get rate limit identifier for a request
 * Uses user ID for authenticated requests, IP for anonymous
 */
export async function getRateLimitIdentifier(
  request: NextRequest
): Promise<{ identifier: string; isAuthenticated: boolean; userId?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return {
        identifier: session.user.email,
        isAuthenticated: true,
        userId: session.user.email,
      };
    }
  } catch {
    // Session check failed, use IP
  }

  return {
    identifier: `ip:${getIpAddress(request)}`,
    isAuthenticated: false,
  };
}

/**
 * Apply rate limit to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<RateLimitResult & { identifier: string }> {
  const { identifier } = await getRateLimitIdentifier(request);
  const config = getRateLimitConfig(endpoint);

  const result = await checkRateLimit(`${endpoint}:${identifier}`, config.limit, config.window);

  return { ...result, identifier };
}

/**
 * Create a 429 Too Many Requests response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const config = getRateLimitConfig('default');
  const message = customMessage || config.message || 'Rate limit exceeded';

  return NextResponse.json(
    {
      error: message,
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  const headers = getRateLimitHeaders(result);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Rate limit wrapper for API route handlers
 * @example
 * export async function POST(request: NextRequest) {
 *   return withRateLimit(request, 'convert', async () => {
 *     // Your handler logic here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */
export async function withRateLimit(
  request: NextRequest,
  endpoint: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await applyRateLimit(request, endpoint);
  const config = getRateLimitConfig(endpoint);

  if (!result.success) {
    return createRateLimitResponse(result, config.message);
  }

  try {
    const response = await handler();
    return addRateLimitHeaders(response, result);
  } catch (error) {
    // Re-throw the error but still include rate limit info
    throw error;
  }
}

/**
 * Check rate limit and return result without blocking
 * Useful when you need more control over the response
 */
export async function checkEndpointRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<{
  allowed: boolean;
  result: RateLimitResult;
  headers: Record<string, string>;
  errorResponse?: NextResponse;
}> {
  const result = await applyRateLimit(request, endpoint);
  const config = getRateLimitConfig(endpoint);
  const headers = getRateLimitHeaders(result);

  if (!result.success) {
    return {
      allowed: false,
      result,
      headers,
      errorResponse: createRateLimitResponse(result, config.message),
    };
  }

  return {
    allowed: true,
    result,
    headers,
  };
}
