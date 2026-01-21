/**
 * SSO Configuration Management API
 * GET /api/sso/config/[configId] - Get specific SSO configuration
 * PATCH /api/sso/config/[configId] - Update SSO configuration
 * DELETE /api/sso/config/[configId] - Delete SSO configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  getSSOConfig,
  updateSSOConfig,
  deleteSSOConfig,
  activateSSOConfig,
  deactivateSSOConfig,
} from '@/lib/sso/service';
import type { SSOConfiguration } from '@/lib/sso/types';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

const updateSSOConfigSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  enforceSSO: z.boolean().optional(),
  allowBypass: z.boolean().optional(),
  jitProvisioning: z.boolean().optional(),
  defaultRole: z.enum(['member', 'admin']).optional(),
  config: z.record(z.unknown()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only enterprise users can access SSO
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:config:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get SSO configuration
    const config = await getSSOConfig(configId);

    if (!config) {
      return NextResponse.json({ error: 'SSO configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('SSO config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only enterprise users can configure SSO
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:config:update:${userId}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateSSOConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if config exists
    const existingConfig = await getSSOConfig(configId);
    if (!existingConfig) {
      return NextResponse.json({ error: 'SSO configuration not found' }, { status: 404 });
    }

    // Handle status change specially
    let updatedConfig;
    if (validation.data.status === 'active') {
      updatedConfig = await activateSSOConfig(configId);
    } else if (validation.data.status === 'inactive') {
      updatedConfig = await deactivateSSOConfig(configId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { status, ...updateData } = validation.data;
      // Cast config to the expected type since it's validated by the schema
      const typedUpdateData = updateData as Partial<
        Pick<
          SSOConfiguration,
          'config' | 'enforceSSO' | 'allowBypass' | 'jitProvisioning' | 'defaultRole'
        >
      >;
      updatedConfig = await updateSSOConfig(configId, typedUpdateData);
    }

    if (!updatedConfig) {
      return NextResponse.json({ error: 'Failed to update SSO configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      message: 'SSO configuration updated successfully',
    });
  } catch (error) {
    console.error('SSO config PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only enterprise users can configure SSO
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:config:delete:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if config exists
    const existingConfig = await getSSOConfig(configId);
    if (!existingConfig) {
      return NextResponse.json({ error: 'SSO configuration not found' }, { status: 404 });
    }

    // Delete SSO configuration
    const deleted = await deleteSSOConfig(configId);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete SSO configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SSO configuration deleted successfully',
    });
  } catch (error) {
    console.error('SSO config DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
