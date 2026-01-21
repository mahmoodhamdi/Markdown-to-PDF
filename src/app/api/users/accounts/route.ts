/**
 * Connected Accounts API Route
 * GET - List connected OAuth accounts
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getUserAccounts, getAvailableProviders } from '@/lib/auth/account-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const accounts = await getUserAccounts(userId);
    const availableProviders = getAvailableProviders();

    // Map accounts with connection status
    const providersWithStatus = availableProviders.map((provider) => {
      const account = accounts.find((a) => a.provider === provider.id);
      return {
        id: provider.id,
        name: provider.name,
        icon: provider.icon,
        connected: !!account,
        accountId: account?._id,
        providerEmail: account?.providerEmail,
        providerName: account?.providerName,
        connectedAt: account?.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      accounts: providersWithStatus,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get accounts' }, { status: 500 });
  }
}
