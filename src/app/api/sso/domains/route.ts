/**
 * SSO Domain Management API
 * GET /api/sso/domains - List domain mappings for organization
 * POST /api/sso/domains - Create new domain mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  createDomainMapping,
  getSSOConfigByOrganization,
  getDomainsForConfig,
} from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

const createDomainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Invalid domain format'),
  organizationId: z.string().min(1),
  ssoConfigId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
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
    const rateLimitResult = checkRateLimit(`sso:domains:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get organization ID from query params
    const organizationId = request.nextUrl.searchParams.get('organizationId');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get SSO config for organization first
    const ssoConfig = await getSSOConfigByOrganization(organizationId);
    if (!ssoConfig) {
      return NextResponse.json({
        success: true,
        domains: [],
      });
    }

    // Get domain mappings for the SSO config
    const domains = await getDomainsForConfig(ssoConfig.id);

    return NextResponse.json({
      success: true,
      domains,
    });
  } catch (error) {
    console.error('SSO domains GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const rateLimitResult = checkRateLimit(`sso:domains:create:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createDomainSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { domain, organizationId, ssoConfigId } = validation.data;

    // Verify SSO config exists and belongs to organization
    const ssoConfig = await getSSOConfigByOrganization(organizationId);
    if (!ssoConfig || ssoConfig.id !== ssoConfigId) {
      return NextResponse.json({ error: 'Invalid SSO configuration' }, { status: 400 });
    }

    // Create domain mapping
    const mapping = await createDomainMapping(domain, organizationId, ssoConfigId);

    return NextResponse.json({
      success: true,
      domain: mapping,
      verification: {
        method: 'dns',
        token: mapping.verificationToken,
        instructions: `Add a TXT record with value "${mapping.verificationToken}" to verify domain ownership`,
      },
    });
  } catch (error) {
    console.error('SSO domains POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
