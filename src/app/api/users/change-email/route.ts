/**
 * Change Email API
 * POST /api/users/change-email - Request email change verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  createEmailChangeToken,
  countRecentEmailChangeRequests,
  isEmailPendingChange,
} from '@/lib/db/models/EmailChangeToken';
import { emailService } from '@/lib/email/service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema
const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Rate limit constants
const MAX_EMAIL_CHANGE_REQUESTS_PER_HOUR = 3;
const EMAIL_CHANGE_TOKEN_EXPIRY_MINUTES = 60;

/**
 * POST /api/users/change-email
 * Request email change - sends verification to new email
 */
export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`change-email:${ip}`, 10, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = changeEmailSchema.safeParse(body);

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

    const { newEmail, password } = validation.data;
    const normalizedNewEmail = newEmail.toLowerCase();
    const currentEmail = session.user.email.toLowerCase();

    // Check if new email is same as current
    if (normalizedNewEmail === currentEmail) {
      return NextResponse.json(
        { error: 'New email must be different from current email', code: 'same_email' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch user
    const user = await User.findById(currentEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'not_found' },
        { status: 404 }
      );
    }

    // Check if user has a password (required for email change)
    if (!user.password) {
      return NextResponse.json(
        {
          error: 'This account uses social login. Email change is not available.',
          code: 'oauth_account',
        },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password is incorrect', code: 'invalid_password' },
        { status: 400 }
      );
    }

    // Check if new email already exists
    const existingUser = await User.findById(normalizedNewEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists', code: 'email_exists' },
        { status: 400 }
      );
    }

    // Check if new email has a pending change request
    const isPending = await isEmailPendingChange(normalizedNewEmail);
    if (isPending) {
      return NextResponse.json(
        { error: 'This email has a pending verification request', code: 'email_pending' },
        { status: 400 }
      );
    }

    // Check per-user rate limit
    const recentRequests = await countRecentEmailChangeRequests(currentEmail, 60);
    if (recentRequests >= MAX_EMAIL_CHANGE_REQUESTS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many email change requests. Please try again later.', code: 'rate_limited' },
        { status: 429 }
      );
    }

    // Create email change token
    const { token } = await createEmailChangeToken(
      currentEmail,
      currentEmail,
      normalizedNewEmail,
      EMAIL_CHANGE_TOKEN_EXPIRY_MINUTES
    );

    // Send verification email to new address
    if (emailService.isConfigured()) {
      await emailService.sendEmailChangeVerification(
        {
          email: currentEmail,
          name: user.name || '',
        },
        normalizedNewEmail,
        token,
        EMAIL_CHANGE_TOKEN_EXPIRY_MINUTES
      );
    } else {
      // In development, log the token
      console.log(`[DEV] Email change token for ${currentEmail} -> ${normalizedNewEmail}: ${token}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent to your new email address. Please check your inbox.',
    });
  } catch (error) {
    console.error('Change email error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
