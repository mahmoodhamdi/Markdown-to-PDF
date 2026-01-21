'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { UsageStats, UsageHistory } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getPlanLimits } from '@/lib/plans/config';
import { useStorageQuota } from '@/hooks/useStorage';
import { useAnalyticsHistory } from '@/hooks/useAnalytics';

export default function UsagePage() {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard.usage');
  const tAuth = useTranslations('auth');

  // Use SWR hooks for cached data fetching
  const { quota, filesCount, isLoading: storageLoading } = useStorageQuota();
  const { history, isLoading: historyLoading } = useAnalyticsHistory('7');

  // Memoize history data transformation
  const historyData = useMemo(() => {
    if (!history?.daily) return [];
    return history.daily.map((day) => ({
      date: day.date,
      conversions: day.conversions || 0,
      apiCalls: day.apiCalls || 0,
    }));
  }, [history?.daily]);

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

  // Current usage from session + SWR data
  const usage = {
    conversions: user?.usage?.conversions || 0,
    apiCalls: user?.usage?.apiCalls || 0,
    storageUsed: quota?.used || 0,
    filesUploaded: filesCount,
  };

  // Calculate reset time (midnight tomorrow)
  const getResetTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
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
        loading={storageLoading}
      />

      {/* Usage History */}
      <UsageHistory
        data={historyData}
        maxConversions={
          limits.conversionsPerDay === Infinity ? undefined : limits.conversionsPerDay
        }
        loading={historyLoading}
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
