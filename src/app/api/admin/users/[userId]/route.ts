/**
 * Admin User Detail API
 * PATCH /api/admin/users/[userId]
 *
 * Allows an admin to update a user's plan and/or role.
 * The [userId] segment is the user's email address (the _id in the User model).
 *
 * Request body (all fields optional, at least one required):
 *   plan - 'free' | 'pro' | 'team' | 'enterprise'
 *   role - 'user' | 'admin'
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

// Zod schema for the PATCH body
const updateUserSchema = z
  .object({
    plan: z.enum(['free', 'pro', 'team', 'enterprise']).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine((data) => data.plan !== undefined || data.role !== undefined, {
    message: 'At least one of plan or role must be provided',
  });

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // Verify admin identity
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  // Rate limit: 60 updates per minute per admin
  const rateLimitResult = checkRateLimit(`admin:users:update:${adminUser?.email ?? 'unknown'}`, 60, 60_000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Resolve dynamic route param
  const { userId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Decode the userId in case the email was URL-encoded
  const targetEmail = decodeURIComponent(userId).toLowerCase();

  // Parse and validate the request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = updateUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const updates = validation.data;

  try {
    await connectDB();

    // Prevent an admin from accidentally removing their own admin role
    if (targetEmail === adminUser?.email && updates.role === 'user') {
      return NextResponse.json(
        { error: 'Admins cannot remove their own admin role' },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: targetEmail },
      { $set: updates },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.info(
      `[ADMIN] ${adminUser?.email ?? 'unknown'} updated user ${targetEmail}:`,
      JSON.stringify(updates)
    );

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (err) {
    console.error('Admin user update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
