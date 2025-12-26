'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  // Loading state
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  const user = session?.user;

  // Get plan limits
  const conversionsLimit = getPlanConversionsLimit(user?.plan || 'free');

  return (
    <DashboardOverview
      userName={user?.name || undefined}
      conversionsToday={user?.usage?.conversions || 0}
      conversionsLimit={conversionsLimit}
      storageUsed="0 MB"
      storageLimit="100 MB"
      plan={user?.plan || 'free'}
      emailVerified={user?.emailVerified ?? true}
    />
  );
}

function getPlanConversionsLimit(plan: string): number {
  const limits: Record<string, number> = {
    free: 20,
    pro: 500,
    team: Infinity,
    enterprise: Infinity,
  };
  return limits[plan] || 20;
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
