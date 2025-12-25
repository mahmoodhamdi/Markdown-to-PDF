'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { UsageStats, UsageHistory } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getPlanLimits } from '@/lib/plans/config';

export default function UsagePage() {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard.usage');
  const tAuth = useTranslations('auth');

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  // Loading state
  if (status === 'loading') {
    return <UsageSkeleton />;
  }

  const user = session?.user;
  const plan = user?.plan || 'free';
  const limits = getPlanLimits(plan);

  // Current usage from session
  const usage = {
    conversions: user?.usage?.conversions || 0,
    apiCalls: user?.usage?.apiCalls || 0,
    storageUsed: 0, // TODO: Fetch from storage API
    filesUploaded: 0, // TODO: Fetch from storage API
  };

  // Calculate reset time (midnight tomorrow)
  const getResetTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  };

  // Generate mock history data for the past 7 days
  // TODO: Replace with actual API call to /api/analytics/history
  const generateHistoryData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        conversions: i === 0 ? usage.conversions : Math.floor(Math.random() * 15),
        apiCalls: i === 0 ? usage.apiCalls : Math.floor(Math.random() * 50),
      });
    }
    return data;
  };

  const planLabels: Record<string, string> = {
    free: tAuth('free'),
    pro: tAuth('pro'),
    team: tAuth('team'),
    enterprise: tAuth('enterprise'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {planLabels[plan] || plan} {t('plan')}
        </Badge>
      </div>

      {/* Usage Stats */}
      <UsageStats
        usage={usage}
        limits={{
          conversionsPerDay: limits.conversionsPerDay,
          apiCallsPerDay: limits.apiCallsPerDay,
          cloudStorageBytes: limits.cloudStorageBytes,
          maxBatchFiles: limits.maxBatchFiles,
        }}
        resetTime={getResetTime()}
      />

      {/* Usage History */}
      <UsageHistory
        data={generateHistoryData()}
        maxConversions={limits.conversionsPerDay === Infinity ? undefined : limits.conversionsPerDay}
      />
    </div>
  );
}

function UsageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
