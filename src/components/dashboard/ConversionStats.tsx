'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Zap, Upload, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyUsageData {
  date: string;
  conversions: number;
  apiCalls: number;
  fileUploads: number;
  fileDownloads: number;
  templatesUsed: number;
  batchConversions: number;
  storageUsed: number;
}

interface AnalyticsSummary {
  today: DailyUsageData;
  thisWeek: DailyUsageData;
  thisMonth: DailyUsageData;
  previousWeek?: DailyUsageData;
  previousMonth?: DailyUsageData;
  limits: {
    conversionsPerDay: number | 'unlimited';
    apiCallsPerDay: number | 'unlimited';
  };
  remaining: {
    conversionsToday: number | 'unlimited';
    apiCallsToday: number | 'unlimited';
  };
  plan: string;
}

interface ConversionStatsProps {
  summary: AnalyticsSummary;
  loading?: boolean;
}

// Calculate trend percentage
function calculateTrend(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// Trend indicator component
function TrendIndicator({ trend, className }: { trend: number | null; className?: string }) {
  const t = useTranslations('dashboard.analytics');

  if (trend === null) {
    return null;
  }

  if (trend === 0) {
    return (
      <span
        className={cn('inline-flex items-center text-xs text-muted-foreground', className)}
        aria-label={t('noChange')}
      >
        <Minus className="h-3 w-3 me-0.5" aria-hidden="true" />
        <span>{t('noChange')}</span>
      </span>
    );
  }

  const isPositive = trend > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <span
      className={cn('inline-flex items-center text-xs font-medium', colorClass, className)}
      aria-label={
        isPositive ? t('trendUp', { percent: trend }) : t('trendDown', { percent: Math.abs(trend) })
      }
    >
      <Icon className="h-3 w-3 me-0.5" aria-hidden="true" />
      <span>{Math.abs(trend)}%</span>
    </span>
  );
}

export function ConversionStats({ summary, loading }: ConversionStatsProps) {
  const t = useTranslations('dashboard.analytics');

  // Calculate trends (week over week)
  const conversionsTrend = summary.previousWeek
    ? calculateTrend(summary.thisWeek.conversions, summary.previousWeek.conversions)
    : null;
  const apiCallsTrend = summary.previousWeek
    ? calculateTrend(summary.thisWeek.apiCalls, summary.previousWeek.apiCalls)
    : null;
  const uploadsTrend = summary.previousWeek
    ? calculateTrend(summary.thisWeek.fileUploads, summary.previousWeek.fileUploads)
    : null;
  const downloadsTrend = summary.previousWeek
    ? calculateTrend(summary.thisWeek.fileDownloads, summary.previousWeek.fileDownloads)
    : null;

  const stats = [
    {
      label: t('conversionsToday'),
      value: summary.today.conversions,
      sublabel:
        summary.limits.conversionsPerDay === 'unlimited'
          ? t('unlimited')
          : `${t('of')} ${summary.limits.conversionsPerDay}`,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: conversionsTrend,
      trendLabel: t('vsLastWeek'),
    },
    {
      label: t('apiCallsToday'),
      value: summary.today.apiCalls,
      sublabel:
        summary.limits.apiCallsPerDay === 'unlimited'
          ? t('unlimited')
          : `${t('of')} ${summary.limits.apiCallsPerDay}`,
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: apiCallsTrend,
      trendLabel: t('vsLastWeek'),
    },
    {
      label: t('uploadsThisWeek'),
      value: summary.thisWeek.fileUploads,
      sublabel: t('files'),
      icon: Upload,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: uploadsTrend,
      trendLabel: t('vsLastWeek'),
    },
    {
      label: t('downloadsThisWeek'),
      value: summary.thisWeek.fileDownloads,
      sublabel: t('files'),
      icon: Download,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: downloadsTrend,
      trendLabel: t('vsLastWeek'),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={cn('p-3 rounded-lg shrink-0', stat.bgColor)}>
                  <Icon className={cn('h-6 w-6', stat.color)} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold tabular-nums">
                      {stat.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">{stat.sublabel}</span>
                  </div>
                  {stat.trend !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendIndicator trend={stat.trend} />
                      <span className="text-[10px] text-muted-foreground">{stat.trendLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
