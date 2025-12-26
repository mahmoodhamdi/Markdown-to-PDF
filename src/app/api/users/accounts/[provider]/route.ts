/**
 * Provider Account API Route
 * DELETE - Disconnect a specific OAuth provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { unlinkAccount, type OAuthProvider } from '@/lib/auth/account-service';

const validProviders: OAuthProvider[] = ['github', 'google'];

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { provider } = await context.params;

    // Validate provider
    if (!validProviders.includes(provider as OAuthProvider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const userId = session.user.email;
    const result = await unlinkAccount(userId, provider as OAuthProvider);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: 'unlink_failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Unlink account error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
