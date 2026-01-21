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
import {
  User,
  UserFile,
  UsageEvent,
  DailyUsage,
  Team,
  TeamMemberLookup,
  TeamActivity,
  TeamInvitation,
  RegionalSubscription,
  Session,
  Account,
  PasswordResetToken,
  EmailVerificationToken,
  EmailChangeToken,
} from '@/lib/db/models';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { emailService } from '@/lib/email/service';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

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
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'User not found', code: 'not_found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });
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
    const user = await User.findByIdAndUpdate(session.user.email, { $set: updates }, { new: true });

    if (!user) {
      return NextResponse.json({ error: 'User not found', code: 'not_found' }, { status: 404 });
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

// Validation schema for account deletion
const deleteAccountSchema = z.object({
  confirm: z.literal(true),
  password: z.string().min(1, 'Password is required'),
});

/**
 * DELETE /api/users/profile
 * Delete the current user's account
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Rate limit (very strict for deletion)
    const rateLimitResult = checkRateLimit(`profile:delete:${userEmail}`, 3, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Validate request body
    const validation = deleteAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Account deletion requires confirmation and password',
          code: 'validation_error',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    await connectDB();

    // Find user first to check if they exist
    const user = await User.findById(userEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found', code: 'not_found' }, { status: 404 });
    }

    // Verify password
    if (user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid password', code: 'invalid_password' },
          { status: 401 }
        );
      }
    } else {
      // User signed up with OAuth, check if they provided their email as password (simple verification)
      if (password !== userEmail) {
        return NextResponse.json(
          {
            error: 'For OAuth accounts, please enter your email address to confirm deletion',
            code: 'invalid_confirmation',
          },
          { status: 401 }
        );
      }
    }

    // Store user info for confirmation email before deletion
    const userName = user.name || 'User';

    // Cancel any active subscriptions
    await cancelUserSubscriptions(userEmail, user);

    // Remove user from teams and transfer ownership or delete teams
    await handleTeamMemberships(userEmail);

    // Delete all user-related data
    await deleteUserData(userEmail);

    // Delete user
    await User.findByIdAndDelete(userEmail);

    // Send confirmation email
    if (emailService.isConfigured()) {
      try {
        await emailService.sendAccountDeletion({ email: userEmail, name: userName });
      } catch (emailError) {
        console.error('Failed to send deletion confirmation email:', emailError);
        // Don't fail the deletion if email fails
      }
    }

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

/**
 * Cancel any active subscriptions for the user
 */
async function cancelUserSubscriptions(
  userEmail: string,
  user: { stripeSubscriptionId?: string; plan: string }
) {
  // Cancel Stripe subscription
  if (user.stripeSubscriptionId) {
    try {
      // Import Stripe gateway dynamically to avoid circular dependencies
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');
      if (stripeGateway.isConfigured()) {
        await stripeGateway.cancelSubscription(user.stripeSubscriptionId);
      }
    } catch (error) {
      console.error('Failed to cancel Stripe subscription:', error);
    }
  }

  // Cancel regional subscriptions (Paymob, PayTabs, Paddle)
  const regionalSubs = await RegionalSubscription.find({
    userId: userEmail,
    status: { $in: ['active', 'trialing'] },
  });

  for (const sub of regionalSubs) {
    try {
      if (sub.gateway === 'paymob') {
        const { paymobGateway } = await import('@/lib/payments/paymob/gateway');
        if (paymobGateway.isConfigured()) {
          await paymobGateway.cancelSubscription(sub.gatewayTransactionId);
        }
      } else if (sub.gateway === 'paytabs') {
        const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');
        if (paytabsGateway.isConfigured()) {
          await paytabsGateway.cancelSubscription(sub.gatewayTransactionId);
        }
      }
    } catch (error) {
      console.error(`Failed to cancel ${sub.gateway} subscription:`, error);
    }
  }

  // Mark all regional subscriptions as canceled
  await RegionalSubscription.updateMany(
    { userId: userEmail },
    { $set: { status: 'canceled', canceledAt: new Date() } }
  );
}

/**
 * Handle team memberships - remove user or transfer/delete teams
 */
async function handleTeamMemberships(userEmail: string) {
  // Find teams owned by the user
  const ownedTeams = await Team.find({ ownerId: userEmail });

  for (const team of ownedTeams) {
    // Check if there are other admins (all members in the array are active)
    const admins = team.members.filter((m) => m.role === 'admin' && m.userId !== userEmail);

    if (admins.length > 0) {
      // Transfer ownership to the first admin
      const newOwner = admins[0];
      await Team.findByIdAndUpdate(team._id, {
        $set: { ownerId: newOwner.userId },
        $pull: { members: { userId: userEmail } },
      });

      // Log the ownership transfer
      await TeamActivity.create({
        teamId: team._id.toString(),
        userId: 'system',
        action: 'ownership_transferred',
        details: {
          from: userEmail,
          to: newOwner.userId,
          reason: 'account_deletion',
        },
      });
    } else {
      // No admins - delete the team
      const teamIdStr = team._id.toString();
      await Team.findByIdAndDelete(team._id);
      await TeamMemberLookup.deleteMany({ teamId: teamIdStr });
      await TeamActivity.deleteMany({ teamId: teamIdStr });
      await TeamInvitation.deleteMany({ teamId: teamIdStr });
    }
  }

  // Remove user from teams where they're a member (not owner)
  await Team.updateMany(
    { 'members.userId': userEmail, ownerId: { $ne: userEmail } },
    { $pull: { members: { userId: userEmail } } }
  );

  // Delete member lookups
  await TeamMemberLookup.deleteMany({ memberId: userEmail });
}

/**
 * Delete all user-related data
 */
async function deleteUserData(userEmail: string) {
  // Delete files (note: actual storage files should be deleted via Cloudinary/Firebase)
  const files = await UserFile.find({ userId: userEmail });
  if (files.length > 0) {
    try {
      // Import storage service to delete actual files
      const { deleteFile } = await import('@/lib/storage/service');
      for (const file of files) {
        try {
          await deleteFile(userEmail, file._id.toString());
        } catch (err) {
          console.error(`Failed to delete file ${file._id}:`, err);
        }
      }
    } catch (error) {
      console.error('Failed to delete storage files:', error);
    }
  }
  await UserFile.deleteMany({ userId: userEmail });

  // Delete usage data
  await UsageEvent.deleteMany({ userId: userEmail });
  await DailyUsage.deleteMany({ userId: userEmail });

  // Delete team activity (user's actions)
  await TeamActivity.deleteMany({ userId: userEmail });

  // Delete invitations (both sent and received)
  await TeamInvitation.deleteMany({
    $or: [{ invitedBy: userEmail }, { email: userEmail }],
  });

  // Delete sessions
  await Session.deleteMany({ userId: userEmail });

  // Delete connected accounts
  await Account.deleteMany({ userId: userEmail });

  // Delete tokens
  await PasswordResetToken.deleteMany({ userId: userEmail });
  await EmailVerificationToken.deleteMany({ userId: userEmail });
  await EmailChangeToken.deleteMany({ userId: userEmail });
}
