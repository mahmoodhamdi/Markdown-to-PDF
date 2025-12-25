/**
 * Forgot Password API
 * POST /api/auth/forgot-password - Request password reset email
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  createPasswordResetToken,
  countRecentResetRequests,
} from '@/lib/db/models/PasswordResetToken';
import { emailService } from '@/lib/email/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Rate limit constants
const MAX_RESET_REQUESTS_PER_HOUR = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 60;

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit by IP (10 requests per hour)
    const rateLimitResult = checkRateLimit(`forgot-password:${ip}`, 10, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address', code: 'validation_error' },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase();

    await connectDB();

    // Check per-email rate limit
    const recentRequests = await countRecentResetRequests(normalizedEmail, 60);
    if (recentRequests >= MAX_RESET_REQUESTS_PER_HOUR) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Look up user
    const user = await User.findById(normalizedEmail);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Only send reset email if user has a password (not OAuth-only)
    if (!user.password) {
      // User signed up via OAuth, no password to reset
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Create password reset token
    const { token } = await createPasswordResetToken(
      normalizedEmail,
      RESET_TOKEN_EXPIRY_MINUTES
    );

    // Send password reset email
    if (emailService.isConfigured()) {
      await emailService.sendPasswordResetEmail(
        {
          email: normalizedEmail,
          name: user.name || '',
        },
        token,
        RESET_TOKEN_EXPIRY_MINUTES
      );
    } else {
      // In development, log the token
      console.log(`[DEV] Password reset token for ${normalizedEmail}: ${token}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
