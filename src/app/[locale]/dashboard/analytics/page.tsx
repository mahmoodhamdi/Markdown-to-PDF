'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { ConversionStats } from '@/components/dashboard/ConversionStats';
import { ThemeUsage } from '@/components/dashboard/ThemeUsage';
import { TemplateUsage } from '@/components/dashboard/TemplateUsage';
import { DateRangePicker, type DateRangePreset } from '@/components/dashboard/DateRangePicker';
import { ExportDialog } from '@/components/dashboard/ExportDialog';
import { AnalyticsSummaryCard } from '@/components/dashboard/AnalyticsSummaryCard';
import { useAnalyticsSummary, useAnalyticsHistory } from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const { status } = useSession();
  const t = useTranslations('dashboard.analytics');
  const [dateRange, setDateRange] = useState<DateRangePreset>('7');

  // Use SWR hooks for cached data fetching
  const {
    summary,
    themeUsage,
    templateUsage,
    isLoading: summaryLoading,
  } = useAnalyticsSummary();

  const { history, isLoading: historyLoading } = useAnalyticsHistory(dateRange);

  const loading = summaryLoading || historyLoading;

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  // Get most used theme for summary card (memoized)
  const mostUsedTheme = useMemo(() => {
    if (!themeUsage || themeUsage.length === 0) return 'github'; // Default
    const sorted = [...themeUsage].sort((a, b) => b.count - a.count);
    return sorted[0]?.theme;
  }, [themeUsage]);

  if (status === 'loading' || loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="flex-1 sm:flex-initial"
          />
          <ExportDialog data={history ?? null} disabled={!history} />
        </div>
      </div>

      {/* Quick Summary */}
      {history && (
        <AnalyticsSummaryCard
          data={history.daily}
          mostUsedTheme={mostUsedTheme}
          loading={loading}
        />
      )}

      {/* Conversion Stats */}
      {summary && <ConversionStats summary={summary} loading={loading} />}

      {/* Chart */}
      {history && (
        <Card>
          <CardHeader>
            <CardTitle>{t('conversionChart')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={history.daily} />
          </CardContent>
        </Card>
      )}

      {/* Usage Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ThemeUsage data={themeUsage || undefined} loading={loading} />
        <TemplateUsage
          data={templateUsage || undefined}
          loading={loading}
          totalTemplatesUsed={summary?.thisMonth.templatesUsed}
        />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Summary Card */}
      <Skeleton className="h-24 rounded-lg" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-80 rounded-lg" />

      {/* Usage Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
