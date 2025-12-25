/**
 * Verify Email Change API
 * POST /api/users/verify-email-change - Verify and complete email change
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  verifyEmailChangeToken,
  markEmailTokenAsUsed,
} from '@/lib/db/models/EmailChangeToken';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Validation schema
const verifyEmailChangeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * POST /api/users/verify-email-change
 * Verify email change token and update user's email
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`verify-email-change:${ip}`, 10, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = verifyEmailChangeSchema.safeParse(body);

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

    const { token } = validation.data;

    await connectDB();

    // Verify token
    const tokenDoc = await verifyEmailChangeToken(token);
    if (!tokenDoc) {
      return NextResponse.json(
        {
          error: 'Invalid or expired token. Please request a new email change.',
          code: 'invalid_token',
        },
        { status: 400 }
      );
    }

    const { userId, oldEmail, newEmail } = tokenDoc;

    // Check if old user still exists
    const oldUser = await User.findById(userId);
    if (!oldUser) {
      // Mark token as used even if user doesn't exist
      await markEmailTokenAsUsed(token);
      return NextResponse.json(
        { error: 'User account not found', code: 'user_not_found' },
        { status: 400 }
      );
    }

    // Check if new email is already taken (by another user since token was created)
    const existingNewUser = await User.findById(newEmail);
    if (existingNewUser) {
      await markEmailTokenAsUsed(token);
      return NextResponse.json(
        { error: 'This email is already in use', code: 'email_taken' },
        { status: 400 }
      );
    }

    // Perform the email change
    // Since _id is the email, we need to:
    // 1. Create a new user document with the new email as _id
    // 2. Delete the old user document

    try {
      // Create new user with new email as _id
      const newUser = new User({
        _id: newEmail,
        email: newEmail,
        name: oldUser.name,
        image: oldUser.image,
        password: oldUser.password,
        plan: oldUser.plan,
        usage: oldUser.usage,
        stripeCustomerId: oldUser.stripeCustomerId,
        stripeSubscriptionId: oldUser.stripeSubscriptionId,
        emailVerified: new Date(), // Mark as verified since they confirmed via email
        createdAt: oldUser.createdAt, // Preserve original creation date
      });

      await newUser.save();

      // Delete old user
      await User.findByIdAndDelete(oldEmail);

      // Mark token as used
      await markEmailTokenAsUsed(token);

      return NextResponse.json({
        success: true,
        message: 'Email changed successfully. Please log in with your new email.',
        newEmail,
      });
    } catch (saveError) {
      console.error('Error saving new user:', saveError);
      return NextResponse.json(
        { error: 'Failed to update email. Please try again.', code: 'save_error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Verify email change error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
