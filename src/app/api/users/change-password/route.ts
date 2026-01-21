/**
 * Change Password API
 * POST /api/users/change-password - Change current user's password
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { invalidateAllUserSessions } from '@/lib/auth/session-service';
import { passwordSchema, BCRYPT_ROUNDS } from '@/lib/auth/password-validation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * POST /api/users/change-password
 * Change the current user's password
 */
export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });
    }

    // Rate limit (strict for security)
    const rateLimitResult = checkRateLimit(
      `change-password:${session.user.email}`,
      5,
      3600000 // 5 attempts per hour
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validation.data;

    await connectDB();

    // Fetch user with password
    const user = await User.findById(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found', code: 'not_found' }, { status: 404 });
    }

    // Check if user has a password (not OAuth-only)
    if (!user.password) {
      return NextResponse.json(
        {
          error: 'This account uses social login. Password change is not available.',
          code: 'oauth_account',
        },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect', code: 'invalid_password' },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password', code: 'same_password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await User.findByIdAndUpdate(session.user.email, {
      $set: { password: hashedPassword },
    });

    // Invalidate all sessions for security (user will need to log in again)
    await invalidateAllUserSessions(session.user.email);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please sign in again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
