/**
 * Account Service
 * Manages OAuth connected accounts for security settings
 */

import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db/mongodb';
import { Account, User, type IAccount, type OAuthProvider } from '@/lib/db/models';

// Re-export types for convenience
export type { OAuthProvider } from '@/lib/db/models';

// Get all connected accounts for a user
export async function getUserAccounts(userId: string): Promise<IAccount[]> {
  await connectDB();

  const accounts = await Account.find({ userId })
    .select('-accessToken -refreshToken')
    .lean();

  return accounts;
}

// Link a new OAuth account
export async function linkAccount(
  userId: string,
  provider: OAuthProvider,
  providerAccountId: string,
  providerEmail?: string,
  providerName?: string,
  providerImage?: string,
  accessToken?: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<IAccount> {
  await connectDB();

  const accountId = randomUUID();

  const account = new Account({
    _id: accountId,
    userId,
    provider,
    providerAccountId,
    providerEmail,
    providerName,
    providerImage,
    accessToken,
    refreshToken,
    expiresAt,
  });

  await account.save();
  return account.toObject();
}

// Unlink an OAuth account
export async function unlinkAccount(
  userId: string,
  provider: OAuthProvider
): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  // Check if user has a password set (can't unlink last login method)
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Get all connected accounts
  const accounts = await Account.find({ userId });
  const hasPassword = !!user.password;

  // Ensure user has at least one other login method
  if (!hasPassword && accounts.length <= 1) {
    return {
      success: false,
      error: 'Cannot disconnect. You need at least one login method.',
    };
  }

  const result = await Account.deleteOne({ userId, provider });

  if (result.deletedCount === 0) {
    return { success: false, error: 'Account not found' };
  }

  return { success: true };
}

// Check if user has a specific provider connected
export async function hasProviderConnected(
  userId: string,
  provider: OAuthProvider
): Promise<boolean> {
  await connectDB();

  const account = await Account.findOne({ userId, provider });
  return !!account;
}

// Update account tokens (for token refresh)
export async function updateAccountTokens(
  userId: string,
  provider: OAuthProvider,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<void> {
  await connectDB();

  await Account.updateOne(
    { userId, provider },
    {
      accessToken,
      ...(refreshToken && { refreshToken }),
      ...(expiresAt && { expiresAt }),
    }
  );
}

// Get available providers for connection
export function getAvailableProviders(): {
  id: OAuthProvider;
  name: string;
  icon: string;
}[] {
  return [
    { id: 'github', name: 'GitHub', icon: 'github' },
    { id: 'google', name: 'Google', icon: 'google' },
  ];
}
