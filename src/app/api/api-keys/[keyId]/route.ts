/**
 * API Key Management API
 * GET /api/api-keys/[keyId] - Get API key details
 * DELETE /api/api-keys/[keyId] - Revoke API key
 * PATCH /api/api-keys/[keyId] - Update API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { ApiKey, API_PERMISSIONS, type ApiPermission } from '@/lib/db/models/ApiKey';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ keyId: string }>;
}

// Validation schema for updating an API key
const updateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  permissions: z
    .array(z.enum(API_PERMISSIONS as unknown as [string, ...string[]]))
    .min(1, 'At least one permission is required')
    .optional(),
});

/**
 * GET /api/api-keys/[keyId]
 * Get details of a specific API key
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { keyId } = await params;

    // Validate keyId format
    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    // Rate limit
    const rateLimitResult = checkRateLimit(`api-keys:get:${userId}`, 60, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    await connectDB();

    // Find the API key
    const apiKey = await ApiKey.findOne({
      _id: keyId,
      userId,
      revokedAt: null,
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey._id.toString(),
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
        updatedAt: apiKey.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 });
  }
}

/**
 * DELETE /api/api-keys/[keyId]
 * Revoke an API key
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { keyId } = await params;

    // Validate keyId format
    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    // Rate limit
    const rateLimitResult = checkRateLimit(`api-keys:revoke:${userId}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    await connectDB();

    // Revoke the API key
    const revoked = await ApiKey.revokeKey(keyId, userId);

    if (!revoked) {
      return NextResponse.json({ error: 'API key not found or already revoked' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}

/**
 * PATCH /api/api-keys/[keyId]
 * Update an API key (name and/or permissions)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { keyId } = await params;

    // Validate keyId format
    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    // Rate limit
    const rateLimitResult = checkRateLimit(`api-keys:update:${userId}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if there's anything to update
    if (!updates.name && !updates.permissions) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    await connectDB();

    // Build update object
    const updateFields: Record<string, unknown> = {};
    if (updates.name) {
      updateFields.name = updates.name.trim();
    }
    if (updates.permissions) {
      updateFields.permissions = updates.permissions as ApiPermission[];
    }

    // Update the API key
    const apiKey = await ApiKey.findOneAndUpdate(
      {
        _id: keyId,
        userId,
        revokedAt: null,
      },
      { $set: updateFields },
      { new: true }
    );

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey._id.toString(),
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
        updatedAt: apiKey.updatedAt.toISOString(),
      },
      message: 'API key updated successfully',
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}
