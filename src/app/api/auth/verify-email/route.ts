/**
 * Email Verification API
 * POST /api/auth/verify-email - Verify email with token
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  verifyEmailVerificationToken,
  markVerificationTokenAsUsed,
} from '@/lib/db/models/EmailVerificationToken';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid token', code: 'invalid_token' },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    await connectDB();

    // Verify the token
    const tokenDoc = await verifyEmailVerificationToken(token);

    if (!tokenDoc) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification link',
          code: 'token_invalid',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'user_not_found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Mark token as used anyway
      await markVerificationTokenAsUsed(token);

      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Update user's emailVerified status
    user.emailVerified = new Date();
    await user.save();

    // Mark token as used
    await markVerificationTokenAsUsed(token);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed', code: 'server_error' },
      { status: 500 }
    );
  }
}
