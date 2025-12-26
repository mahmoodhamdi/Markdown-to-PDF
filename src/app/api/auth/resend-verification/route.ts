/**
 * Resend Verification Email API
 * POST /api/auth/resend-verification - Resend email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  createEmailVerificationToken,
  countRecentVerificationRequests,
} from '@/lib/db/models/EmailVerificationToken';
import { emailService } from '@/lib/email/service';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    await connectDB();

    // Check if user exists
    const user = await User.findById(userEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'user_not_found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Rate limiting: max 3 verification emails per hour
    const recentRequests = await countRecentVerificationRequests(userEmail, 60);
    if (recentRequests >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification requests. Please try again later.',
          code: 'rate_limit',
        },
        { status: 429 }
      );
    }

    // Create verification token
    const { token } = await createEmailVerificationToken(userEmail, 24);

    // Send verification email
    if (emailService.isConfigured()) {
      try {
        await emailService.sendEmailVerification(
          { email: userEmail, name: user.name },
          token,
          24
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to send verification email',
            code: 'email_failed',
          },
          { status: 500 }
        );
      }
    } else {
      console.warn('Email service not configured, verification email not sent');
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification', code: 'server_error' },
      { status: 500 }
    );
  }
}
