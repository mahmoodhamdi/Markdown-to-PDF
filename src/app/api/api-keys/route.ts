/**
 * API Keys API
 * GET /api/api-keys - List user's API keys
 * POST /api/api-keys - Create a new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import {
  ApiKey,
  canCreateApiKey,
  getDefaultRateLimit,
  API_PERMISSIONS,
  type ApiPermission,
} from '@/lib/db/models/ApiKey';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';
import { PlanType } from '@/lib/plans/config';

// Validation schema for creating an API key
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  permissions: z
    .array(z.enum(API_PERMISSIONS as unknown as [string, ...string[]]))
    .min(1, 'At least one permission is required')
    .default(['convert', 'preview']),
  expiresIn: z.number().int().min(1).max(365).optional(), // Days until expiration
});

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlan = (session.user.plan as PlanType) || 'free';

    // Rate limit
    const rateLimitResult = checkRateLimit(`api-keys:list:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    await connectDB();

    // Get user's API keys
    const keys = await ApiKey.getUserKeys(userId);

    // Get limits info
    const limitsInfo = await canCreateApiKey(userId, userPlan);

    return NextResponse.json({
      success: true,
      keys: keys.map((key) => ({
        id: key._id.toString(),
        name: key.name,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        expiresAt: key.expiresAt?.toISOString() || null,
        createdAt: key.createdAt.toISOString(),
      })),
      limits: {
        current: limitsInfo.current,
        max: limitsInfo.max,
        canCreate: limitsInfo.allowed,
      },
    });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

/**
 * POST /api/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlan = (session.user.plan as PlanType) || 'free';

    // Rate limit (stricter for creation)
    const rateLimitResult = checkRateLimit(`api-keys:create:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    await connectDB();

    // Check if user can create more keys
    const limitsInfo = await canCreateApiKey(userId, userPlan);
    if (!limitsInfo.allowed) {
      return NextResponse.json(
        {
          error: `You have reached the maximum number of API keys for your plan (${limitsInfo.max}). Please upgrade your plan or revoke an existing key.`,
          code: 'limit_reached',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, permissions, expiresIn } = validation.data;

    // Calculate expiration date if specified
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    // Get default rate limit for the plan
    const rateLimit = getDefaultRateLimit(userPlan);

    // Generate the API key
    const { apiKey, plainKey } = await ApiKey.generateKey(
      userId,
      name,
      permissions as ApiPermission[],
      { expiresAt, rateLimit }
    );

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey._id.toString(),
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
      },
      // IMPORTANT: The plain key is only returned once and should be shown to the user
      plainKey,
      message:
        'API key created successfully. Make sure to copy the key now - it will not be shown again.',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
