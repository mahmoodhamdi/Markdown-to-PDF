/**
 * User Profile API
 * GET /api/users/profile - Get current user's profile
 * PATCH /api/users/profile - Update current user's profile
 * DELETE /api/users/profile - Delete current user's account
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

/**
 * GET /api/users/profile
 * Get the current user's profile
 */
export async function GET(_request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit
    const rateLimitResult = checkRateLimit(`profile:get:${session.user.email}`, 60, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    await connectDB();

    // Fetch user from database
    const user = await User.findById(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'not_found' },
        { status: 404 }
      );
    }

    // Return user profile (excluding sensitive fields)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || '',
        image: user.image || '',
        plan: user.plan,
        usage: user.usage,
        hasPassword: !!user.password,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/profile
 * Update the current user's profile (name, image)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit
    const rateLimitResult = checkRateLimit(`profile:update:${session.user.email}`, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'validation_error',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided', code: 'no_updates' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update user
    const user = await User.findByIdAndUpdate(
      session.user.email,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'not_found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name || '',
        image: user.image || '',
        plan: user.plan,
        usage: user.usage,
        hasPassword: !!user.password,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/profile
 * Delete the current user's account
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit (very strict for deletion)
    const rateLimitResult = checkRateLimit(`profile:delete:${session.user.email}`, 3, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body for confirmation
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Require explicit confirmation
    if (body.confirm !== true) {
      return NextResponse.json(
        {
          error: 'Account deletion requires confirmation',
          code: 'confirmation_required',
          message: 'Please provide { "confirm": true } to confirm account deletion',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user first to check if they exist
    const user = await User.findById(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'not_found' },
        { status: 404 }
      );
    }

    // Check if user has an active paid subscription
    if (user.stripeSubscriptionId || user.plan !== 'free') {
      return NextResponse.json(
        {
          error: 'Please cancel your subscription before deleting your account',
          code: 'active_subscription',
        },
        { status: 400 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(session.user.email);

    // TODO: Clean up related data (files, tokens, etc.)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
