/**
 * API Key Authentication
 * Middleware and utilities for authenticating API requests using API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { ApiKey, type ApiPermission } from '@/lib/db/models/ApiKey';
import { User } from '@/lib/db/models/User';
import { PlanType } from '@/lib/plans/config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * Authenticated API key user context
 */
export interface ApiKeyUser {
  id: string;
  email: string;
  plan: PlanType;
  permissions: ApiPermission[];
  rateLimit: {
    limit: number;
    window: number;
  };
  apiKeyId: string;
  apiKeyName: string;
}

/**
 * Result of API key authentication
 */
export interface ApiKeyAuthResult {
  success: boolean;
  user?: ApiKeyUser;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate a request using API key from Authorization header
 * Returns null if no API key is present (allows fallback to session auth)
 * Returns ApiKeyAuthResult with error if API key is invalid
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const authHeader = request.headers.get('authorization');

  // Check if Authorization header is present with Bearer token
  if (!authHeader?.startsWith('Bearer ')) {
    return null; // No API key auth attempted
  }

  const key = authHeader.substring(7); // Remove "Bearer "

  // Check if it's an API key (starts with mk_)
  if (!key.startsWith('mk_')) {
    return null; // Not an API key, might be other type of token
  }

  // Validate key format
  if (key.length !== 67) {
    return {
      success: false,
      error: 'Invalid API key format',
      statusCode: 401,
    };
  }

  try {
    await connectDB();

    // Verify the API key
    const apiKey = await ApiKey.verifyKey(key);

    if (!apiKey) {
      return {
        success: false,
        error: 'Invalid or expired API key',
        statusCode: 401,
      };
    }

    // Get the user to check their plan
    const user = await User.findById(apiKey.userId);

    if (!user) {
      return {
        success: false,
        error: 'API key owner not found',
        statusCode: 401,
      };
    }

    return {
      success: true,
      user: {
        id: apiKey.userId,
        email: user.email,
        plan: user.plan as PlanType,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        apiKeyId: apiKey._id.toString(),
        apiKeyName: apiKey.name,
      },
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500,
    };
  }
}

/**
 * Check if API key user has a specific permission
 */
export function hasPermission(user: ApiKeyUser, permission: ApiPermission): boolean {
  return user.permissions.includes(permission);
}

/**
 * Create an error response for API key auth failure
 */
export function createApiKeyAuthError(result: ApiKeyAuthResult): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.statusCode || 401 });
}

/**
 * Check rate limit for API key requests
 * Uses the API key's configured rate limit
 */
export async function checkApiKeyRateLimit(user: ApiKeyUser): Promise<{
  success: boolean;
  headers: Record<string, string>;
  error?: string;
}> {
  const rateLimitKey = `api-key:${user.apiKeyId}`;
  const result = checkRateLimit(
    rateLimitKey,
    user.rateLimit.limit,
    user.rateLimit.window * 1000 // Convert seconds to milliseconds
  );

  const headers = getRateLimitHeaders(result);

  if (!result.success) {
    return {
      success: false,
      headers,
      error: `Rate limit exceeded. Limit: ${user.rateLimit.limit} requests per ${user.rateLimit.window} seconds`,
    };
  }

  return {
    success: true,
    headers,
  };
}

/**
 * Create rate limit error response for API key
 */
export function createApiKeyRateLimitError(
  headers: Record<string, string>,
  error: string
): NextResponse {
  return NextResponse.json({ error }, { status: 429, headers });
}

/**
 * Full API key authentication and authorization check
 * Returns authenticated user or error response
 */
export async function requireApiKeyAuth(
  request: NextRequest,
  requiredPermission: ApiPermission
): Promise<{ user: ApiKeyUser } | { response: NextResponse }> {
  const authResult = await authenticateApiKey(request);

  // No API key present
  if (authResult === null) {
    return {
      response: NextResponse.json(
        { error: 'API key required. Use Authorization: Bearer mk_your_api_key' },
        { status: 401 }
      ),
    };
  }

  // API key auth failed
  if (!authResult.success || !authResult.user) {
    return {
      response: createApiKeyAuthError(authResult),
    };
  }

  // Check permission
  if (!hasPermission(authResult.user, requiredPermission)) {
    return {
      response: NextResponse.json(
        { error: `API key lacks '${requiredPermission}' permission` },
        { status: 403 }
      ),
    };
  }

  // Check rate limit
  const rateLimitResult = await checkApiKeyRateLimit(authResult.user);
  if (!rateLimitResult.success) {
    return {
      response: createApiKeyRateLimitError(rateLimitResult.headers, rateLimitResult.error || 'Rate limit exceeded'),
    };
  }

  return { user: authResult.user };
}

/**
 * Combined auth check - tries API key first, then session
 * For endpoints that support both authentication methods
 */
export async function getAuthContext(
  request: NextRequest,
  getServerSession: () => Promise<{ user?: { id?: string; email?: string; plan?: string } } | null>
): Promise<{
  type: 'api-key' | 'session' | 'none';
  user?: ApiKeyUser | { id: string; email: string; plan: PlanType };
}> {
  // Try API key first
  const apiKeyResult = await authenticateApiKey(request);

  if (apiKeyResult?.success && apiKeyResult.user) {
    return { type: 'api-key', user: apiKeyResult.user };
  }

  // Try session auth
  const session = await getServerSession();

  if (session?.user?.id && session.user.email) {
    return {
      type: 'session',
      user: {
        id: session.user.id,
        email: session.user.email,
        plan: (session.user.plan as PlanType) || 'free',
      },
    };
  }

  return { type: 'none' };
}
