/**
 * SSO Configuration API
 * GET /api/sso/config - Get SSO configuration for current organization
 * POST /api/sso/config - Create new SSO configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  createSSOConfig,
  getSSOConfigByOrganization,
} from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

const samlConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string().min(3),
  cert: z.string().min(100),
  callbackUrl: z.string().url(),
  signatureAlgorithm: z.enum(['sha256', 'sha512']).optional(),
  wantAssertionsSigned: z.boolean().optional(),
  wantAuthnResponseSigned: z.boolean().optional(),
  attributeMapping: z.object({
    email: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    groups: z.string().optional(),
  }).optional(),
});

const oidcConfigSchema = z.object({
  clientId: z.string().min(5),
  clientSecret: z.string().min(10),
  issuer: z.string().url(),
  authorizationUrl: z.string().url().optional(),
  tokenUrl: z.string().url().optional(),
  userInfoUrl: z.string().url().optional(),
  jwksUrl: z.string().url().optional(),
  scopes: z.array(z.string()).optional(),
});

const azureADConfigSchema = z.object({
  tenantId: z.string().uuid(),
  clientId: z.string().uuid(),
  clientSecret: z.string().min(10),
  allowedGroups: z.array(z.string()).optional(),
});

const oktaConfigSchema = z.object({
  domain: z.string().min(5),
  clientId: z.string().min(10),
  clientSecret: z.string().min(10),
  authServerId: z.string().optional(),
});

const googleWorkspaceConfigSchema = z.object({
  domain: z.string().min(3),
  clientId: z.string().includes('.apps.googleusercontent.com'),
  clientSecret: z.string().min(10),
  allowedDomains: z.array(z.string()).optional(),
});

const createSSOConfigSchema = z.object({
  organizationId: z.string().min(1),
  provider: z.enum(['saml', 'oidc', 'azure_ad', 'okta', 'google_workspace']),
  domain: z.string().min(3).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Invalid domain format'),
  config: z.union([
    samlConfigSchema,
    oidcConfigSchema,
    azureADConfigSchema,
    oktaConfigSchema,
    googleWorkspaceConfigSchema,
  ]),
  options: z.object({
    enforceSSO: z.boolean().optional(),
    allowBypass: z.boolean().optional(),
    jitProvisioning: z.boolean().optional(),
    defaultRole: z.enum(['member', 'admin']).optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
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

    // Get organization ID from query params
    const organizationId = request.nextUrl.searchParams.get('organizationId');
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Get SSO configuration
    const config = await getSSOConfigByOrganization(organizationId);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('SSO config GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
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
    const rateLimitResult = checkRateLimit(`sso:config:create:${userId}`, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createSSOConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { organizationId, provider, config, domain, options } = validation.data;

    // Check if organization already has SSO config
    const existingConfig = await getSSOConfigByOrganization(organizationId);
    if (existingConfig) {
      return NextResponse.json(
        { error: 'SSO configuration already exists for this organization' },
        { status: 409 }
      );
    }

    // Create SSO configuration
    const ssoConfig = await createSSOConfig(
      organizationId,
      provider,
      config,
      domain,
      options
    );

    return NextResponse.json({
      success: true,
      config: ssoConfig,
      message: 'SSO configuration created successfully',
    });
  } catch (error) {
    console.error('SSO config POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
