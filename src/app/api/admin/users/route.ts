/**
 * Admin Users API
 * GET /api/admin/users
 *
 * Query parameters:
 *   page   - Page number (default: 1)
 *   limit  - Items per page (default: 20, max: 100)
 *   search - Filter by email or name (case-insensitive partial match)
 *   plan   - Filter by plan: free | pro | team | enterprise
 *
 * Returns paginated users sorted by createdAt descending, password excluded.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const VALID_PLANS = ['free', 'pro', 'team', 'enterprise'] as const;
type Plan = (typeof VALID_PLANS)[number];

export async function GET(request: NextRequest) {
  // Verify admin identity
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  // Rate limit: 120 requests per minute per admin
  const rateLimitResult = checkRateLimit(`admin:users:list:${adminUser?.email ?? 'unknown'}`, 120, 60_000);
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

    // Filters
    const search = searchParams.get('search')?.trim() ?? '';
    const planFilter = searchParams.get('plan')?.trim() ?? '';

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      // Case-insensitive partial match on email or name
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ email: regex }, { name: regex }];
    }

    if (planFilter && VALID_PLANS.includes(planFilter as Plan)) {
      query.plan = planFilter;
    }

    await connectDB();

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password') // Never expose password hashes
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        users,
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
    console.error('Admin users list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
