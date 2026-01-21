/**
 * SSO Domain Verification API
 * POST /api/sso/domains/[domain]/verify - Verify domain ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getDomainMapping, verifyDomainMapping } from '@/lib/sso/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only enterprise users can verify domains
    if (session.user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available for Enterprise plans' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check rate limit (limited to prevent abuse)
    const rateLimitResult = checkRateLimit(`sso:domains:verify:${userId}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get domain mapping
    const mapping = await getDomainMapping(domain);

    if (!mapping) {
      return NextResponse.json({ error: 'Domain mapping not found' }, { status: 404 });
    }

    if (mapping.verified) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Domain is already verified',
      });
    }

    if (!mapping.verificationToken) {
      return NextResponse.json({ error: 'No verification token found' }, { status: 400 });
    }

    // Attempt DNS verification
    let verified = false;
    let verificationError: string | undefined;

    try {
      const txtRecords = await resolveTxt(domain);
      const flatRecords = txtRecords.flat();

      // Check if any TXT record contains our verification token
      verified = flatRecords.some((record) => mapping.verificationToken && record.includes(mapping.verificationToken));

      if (!verified) {
        verificationError = 'Verification token not found in DNS TXT records';
      }
    } catch (dnsError) {
      // DNS lookup failed - this is expected during development/testing
      // In production, we would return an error
      console.warn('DNS lookup failed for domain verification:', dnsError);

      // For development/testing, allow manual verification
      const body = await request.json().catch(() => ({}));
      if (body.skipDnsCheck === true && process.env.NODE_ENV === 'development') {
        verified = true;
      } else {
        verificationError =
          'Failed to lookup DNS records. Please ensure DNS is configured correctly.';
      }
    }

    if (verified) {
      await verifyDomainMapping(domain);

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Domain verified successfully',
      });
    }

    return NextResponse.json({
      success: false,
      verified: false,
      error: verificationError,
      instructions: `Add a TXT record with value "${mapping.verificationToken}" to your domain's DNS configuration`,
    });
  } catch (error) {
    console.error('SSO domain verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
