/**
 * User Data Export API
 * GET /api/users/export - Export all user data as ZIP file (GDPR compliance)
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
} from '@/lib/db/models';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import JSZip from 'jszip';

/**
 * GET /api/users/export
 * Export all user data as a ZIP file
 */
export async function GET(_request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Rate limit (1 export per hour)
    const rateLimitResult = checkRateLimit(`export:${userEmail}`, 1, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'You can only export data once per hour. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    await connectDB();

    // Collect all user data
    const exportData = await collectUserData(userEmail);

    // Create ZIP file
    const zip = new JSZip();

    // Add profile data
    zip.file('profile.json', JSON.stringify(exportData.profile, null, 2));

    // Add files list
    zip.file('files.json', JSON.stringify(exportData.files, null, 2));

    // Add usage data
    zip.file('usage/events.json', JSON.stringify(exportData.usageEvents, null, 2));
    zip.file('usage/daily.json', JSON.stringify(exportData.dailyUsage, null, 2));

    // Add teams data
    zip.file('teams/memberships.json', JSON.stringify(exportData.teamMemberships, null, 2));
    zip.file('teams/owned.json', JSON.stringify(exportData.ownedTeams, null, 2));
    zip.file('teams/activity.json', JSON.stringify(exportData.teamActivity, null, 2));
    zip.file('teams/invitations.json', JSON.stringify(exportData.invitations, null, 2));

    // Add subscription data
    zip.file('subscription.json', JSON.stringify(exportData.subscription, null, 2));

    // Add sessions data
    zip.file('sessions.json', JSON.stringify(exportData.sessions, null, 2));

    // Add connected accounts data
    zip.file('accounts.json', JSON.stringify(exportData.accounts, null, 2));

    // Add README
    zip.file(
      'README.txt',
      `User Data Export
================

This archive contains all data associated with your account: ${userEmail}

Export Date: ${new Date().toISOString()}

Files Included:
- profile.json: Your profile information
- files.json: List of files you've uploaded
- usage/events.json: Usage event history
- usage/daily.json: Daily usage aggregates
- teams/memberships.json: Teams you're a member of
- teams/owned.json: Teams you own
- teams/activity.json: Your team activity
- teams/invitations.json: Team invitations
- subscription.json: Subscription information
- sessions.json: Login sessions
- accounts.json: Connected OAuth accounts

For questions about your data, contact support.
`
    );

    // Generate ZIP as blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `user-data-export-${timestamp}.zip`;

    // Convert blob to Response
    return new Response(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBlob.size.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}

/**
 * Collect all user data for export
 */
async function collectUserData(userEmail: string) {
  // Fetch user profile
  const user = await User.findById(userEmail).lean();

  // Profile data (sanitized - no password)
  const profile = user
    ? {
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        usage: user.usage,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    : null;

  // Files
  const files = await UserFile.find({ userId: userEmail }).select('-__v').lean();

  // Usage events (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const usageEvents = await UsageEvent.find({
    userId: userEmail,
    timestamp: { $gte: ninetyDaysAgo },
  })
    .select('-__v')
    .sort({ timestamp: -1 })
    .lean();

  // Daily usage (last 90 days)
  const dailyUsage = await DailyUsage.find({
    userId: userEmail,
    date: { $gte: ninetyDaysAgo.toISOString().split('T')[0] },
  })
    .select('-__v')
    .sort({ date: -1 })
    .lean();

  // Team memberships
  const teamMemberships = await TeamMemberLookup.find({
    memberId: userEmail,
    status: 'active',
  })
    .select('-__v')
    .lean();

  // Owned teams
  const ownedTeams = await Team.find({ ownerId: userEmail }).select('-__v').lean();

  // Team activity (user's actions)
  const teamActivity = await TeamActivity.find({ userId: userEmail })
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  // Invitations (sent and received)
  const invitations = await TeamInvitation.find({
    $or: [{ invitedBy: userEmail }, { email: userEmail }],
  })
    .select('-token -__v')
    .lean();

  // Subscription
  const subscription = user?.stripeSubscriptionId
    ? { stripeSubscriptionId: user.stripeSubscriptionId, plan: user.plan }
    : await RegionalSubscription.findOne({
        userId: userEmail,
        status: { $in: ['active', 'trialing'] },
      })
        .select('-__v')
        .lean();

  // Sessions
  const sessions = await Session.find({ userId: userEmail }).select('-__v').lean();

  // Connected accounts
  const accounts = await Account.find({ userId: userEmail })
    .select('-accessToken -refreshToken -__v')
    .lean();

  return {
    profile,
    files,
    usageEvents,
    dailyUsage,
    teamMemberships,
    ownedTeams,
    teamActivity,
    invitations,
    subscription,
    sessions,
    accounts,
  };
}
