'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, UserPlus, Users, BarChart3 } from 'lucide-react';

interface DailyAnalytics {
  date: string;
  conversions: number;
  newUsers: number;
}

interface AdminAnalytics {
  conversionsToday: number;
  newUsersToday: number;
  activeUsersLast7Days: number;
  dailyStats: DailyAnalytics[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

function MiniBar({ value, max, date }: { value: number; max: number; date: string }) {
  const height = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;

  return (
    <div className="flex flex-col items-center gap-1 group relative">
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
        <div className="bg-popover border rounded px-2 py-1 text-xs shadow-md whitespace-nowrap">
          <span className="font-medium">{value}</span> conversions
          <br />
          <span className="text-muted-foreground">{date}</span>
        </div>
        <div className="border-l border-b border-popover-border w-2 h-2 bg-popover rotate-[-45deg] -mt-1" />
      </div>
      <div className="w-full bg-muted rounded-sm flex items-end" style={{ height: 80 }}>
        <div
          className="w-full bg-primary rounded-sm transition-all duration-300"
          style={{ height: `${height}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground hidden sm:block truncate w-full text-center">
        {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin');

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch {
        setError(t('analytics.fetchError'));
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [t]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('analytics.title')}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxConversions = analytics
    ? Math.max(...analytics.dailyStats.map((d) => d.conversions), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('analytics.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('analytics.conversionsToday')}
          value={analytics?.conversionsToday ?? 0}
          icon={Activity}
          description={t('analytics.conversionsDesc')}
        />
        <StatCard
          title={t('analytics.newUsersToday')}
          value={analytics?.newUsersToday ?? 0}
          icon={UserPlus}
          description={t('analytics.newUsersDesc')}
        />
        <StatCard
          title={t('analytics.activeUsers7Days')}
          value={analytics?.activeUsersLast7Days ?? 0}
          icon={Users}
          description={t('analytics.activeUsersDesc')}
        />
      </div>

      {/* Daily conversions bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('analytics.dailyConversions')}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {t('analytics.last30Days')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analytics || analytics.dailyStats.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              {t('analytics.noData')}
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1 w-full">
                {analytics.dailyStats.map((day) => (
                  <div key={day.date} className="flex-1 min-w-0">
                    <MiniBar value={day.conversions} max={maxConversions} date={day.date} />
                  </div>
                ))}
              </div>
              {/* Summary table below chart */}
              <div className="mt-6 border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        {t('analytics.columnDate')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        {t('analytics.columnConversions')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        {t('analytics.columnNewUsers')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...analytics.dailyStats]
                      .reverse()
                      .slice(0, 10)
                      .map((day) => (
                        <tr key={day.date} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2 text-muted-foreground">{day.date}</td>
                          <td className="px-4 py-2 text-right font-medium">{day.conversions}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">
                            {day.newUsers}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
