/**
 * SSO SP Metadata API
 * GET /api/sso/metadata - Get SAML Service Provider metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateSPMetadata } from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

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

    // Only enterprise users can access SSO metadata
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(`sso:metadata:${userId}`, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get base URL for the application
    const baseUrl = process.env.NEXTAUTH_URL || 'https://md2pdf.app';

    // Generate SP metadata
    const entityId = `${baseUrl}/api/sso/saml`;
    const acsUrl = `${baseUrl}/api/sso/saml/callback`;
    const sloUrl = `${baseUrl}/api/sso/saml/logout`;

    const metadata = generateSPMetadata(entityId, acsUrl, sloUrl);

    // Check if client wants XML format
    const format = request.nextUrl.searchParams.get('format');

    if (format === 'xml') {
      return new NextResponse(metadata.metadataXml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="sp-metadata.xml"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      metadata: {
        entityId: metadata.entityId,
        acsUrl: metadata.acsUrl,
        sloUrl: metadata.sloUrl,
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        wantAssertionsSigned: true,
        wantAuthnResponseSigned: true,
      },
      downloadUrl: `${baseUrl}/api/sso/metadata?format=xml`,
    });
  } catch (error) {
    console.error('SSO metadata GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
