'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DailyUsage {
  date: string;
  conversions: number;
  apiCalls: number;
}

interface UsageHistoryProps {
  data: DailyUsage[];
  maxConversions?: number;
  loading?: boolean;
}

export function UsageHistory({ data, maxConversions, loading = false }: UsageHistoryProps) {
  const t = useTranslations('dashboard.usage');

  // Calculate max for scaling
  const maxValue = maxConversions || Math.max(...data.map((d) => d.conversions), 1);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto mt-1" />
              </div>
              <div>
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get day name from date
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  // Get formatted date
  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('thisWeek')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('noHistoryData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('thisWeek')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="space-y-3">
          {data.map((day, index) => {
            const percentage = (day.conversions / maxValue) * 100;
            const isToday = index === data.length - 1;

            return (
              <div key={day.date} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', isToday && 'text-primary')}>
                    {getDayName(day.date)}
                    <span className="text-muted-foreground ms-2 text-xs">
                      {getFormattedDate(day.date)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {day.conversions} {t('conversionsLabel')}
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isToday ? 'bg-primary' : 'bg-primary/60'
                    )}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {data.reduce((sum, d) => sum + d.conversions, 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t('totalConversions')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {data.reduce((sum, d) => sum + d.apiCalls, 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t('totalApiCalls')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
