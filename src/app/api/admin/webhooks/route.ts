/**
 * Admin Webhooks API
 * GET /api/admin/webhooks
 *
 * Returns a paginated list of recent webhook events from all payment gateways.
 *
 * Query parameters:
 *   page    - Page number (default: 1)
 *   limit   - Items per page (default: 20, max: 100)
 *   gateway - Filter by gateway: stripe | paymob | paytabs | paddle
 *   status  - Filter by status: processing | processed | failed | skipped
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { connectDB } from '@/lib/db/mongodb';
import { WebhookEvent } from '@/lib/db/models/WebhookEvent';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const VALID_GATEWAYS = ['stripe', 'paymob', 'paytabs', 'paddle'] as const;
const VALID_STATUSES = ['processing', 'processed', 'failed', 'skipped'] as const;

type Gateway = (typeof VALID_GATEWAYS)[number];
type Status = (typeof VALID_STATUSES)[number];

export async function GET(request: NextRequest) {
  // Verify admin identity
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  // Rate limit: 120 requests per minute per admin
  const rateLimitResult = checkRateLimit(`admin:webhooks:${adminUser?.email ?? 'unknown'}`, 120, 60_000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;

    // Optional filters
    const gatewayFilter = searchParams.get('gateway')?.trim() ?? '';
    const statusFilter = searchParams.get('status')?.trim() ?? '';

    const query: Record<string, unknown> = {};

    if (gatewayFilter && VALID_GATEWAYS.includes(gatewayFilter as Gateway)) {
      query.gateway = gatewayFilter;
    }

    if (statusFilter && VALID_STATUSES.includes(statusFilter as Status)) {
      query.status = statusFilter;
    }

    await connectDB();

    const [events, total] = await Promise.all([
      WebhookEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WebhookEvent.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (err) {
    console.error('Admin webhooks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
