/**
 * Reset Password API
 * POST /api/auth/reset-password - Reset password using token
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { verifyPasswordResetToken, markTokenAsUsed } from '@/lib/db/models/PasswordResetToken';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { invalidateAllUserSessions } from '@/lib/auth/session-service';
import { passwordSchema, BCRYPT_ROUNDS } from '@/lib/auth/password-validation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit (10 attempts per hour per IP)
    const rateLimitResult = checkRateLimit(`reset-password:${ip}`, 10, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0] ?? { message: 'Validation failed' };
      return NextResponse.json(
        { error: firstError.message, code: 'validation_error' },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    await connectDB();

    // Verify token
    const tokenDoc = await verifyPasswordResetToken(token);

    if (!tokenDoc) {
      return NextResponse.json(
        {
          error: 'Invalid or expired reset link. Please request a new one.',
          code: 'invalid_token',
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      // Mark token as used even if user doesn't exist
      await markTokenAsUsed(token);
      return NextResponse.json(
        {
          error: 'Invalid or expired reset link. Please request a new one.',
          code: 'invalid_token',
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update user password
    await User.updateOne({ _id: tokenDoc.userId }, { $set: { password: hashedPassword } });

    // Mark token as used
    await markTokenAsUsed(token);

    // Invalidate all existing sessions for security
    await invalidateAllUserSessions(tokenDoc.userId);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
