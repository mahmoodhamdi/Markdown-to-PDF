'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DashboardOverview } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlanLimits, formatFileSize } from '@/lib/plans/config';
import type { PlanType } from '@/lib/plans/config';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect(`/${locale}/auth/login`);
  }

  // Loading state
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  const user = session?.user;

  // Get plan limits from canonical config
  const plan = (user?.plan || 'free') as PlanType;
  const limits = getPlanLimits(plan);
  const conversionsLimit = limits.conversionsPerDay;

  // Derive storage strings from plan limits
  const storageUsedBytes = (user?.usage as Record<string, number> | undefined)?.storageUsed ?? 0;
  const storageUsed = formatFileSize(storageUsedBytes);
  const storageLimit = formatFileSize(limits.cloudStorageBytes);

  return (
    <DashboardOverview
      userName={user?.name || undefined}
      conversionsToday={user?.usage?.conversions || 0}
      conversionsLimit={conversionsLimit}
      storageUsed={storageUsed}
      storageLimit={storageLimit}
      plan={plan}
      emailVerified={user?.emailVerified ?? true}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}
