/**
 * Admin Middleware
 * Verifies the requesting user has the 'admin' role.
 * Call requireAdmin() at the top of any admin API handler and return
 * the error response early when error is non-null.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { NextResponse } from 'next/server';
import type { IUser } from '@/lib/db/models/User';

export interface AdminCheckResult {
  /** Non-null when the check failed – return this response immediately. */
  error: NextResponse | null;
  /** The authenticated admin user document, or null on failure. */
  user: IUser | null;
}

/**
 * requireAdmin
 * Checks that a valid session exists and that the session user has the
 * 'admin' role in the database.  Always returns an object so callers can
 * do a simple early-return pattern:
 *
 * ```ts
 * const { error, user } = await requireAdmin();
 * if (error) return error;
 * // use `user` safely here
 * ```
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    };
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).lean<IUser>();

  if (!user || user.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user };
}
