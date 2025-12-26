'use client';

import { useTranslations } from 'next-intl';
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

interface AnalyticsChartProps {
  data: DailyUsageData[];
  className?: string;
}

export function AnalyticsChart({ data, className }: AnalyticsChartProps) {
  const t = useTranslations('dashboard.analytics');

  // Get max value for scaling
  const maxConversions = Math.max(...data.map((d) => d.conversions), 1);
  const maxApiCalls = Math.max(...data.map((d) => d.apiCalls), 1);

  // Format date for display (e.g., "Mon", "Tue")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    return { day, dayNum };
  };

  // Calculate percentage for bar height
  const getBarHeight = (value: number, max: number) => {
    return Math.max((value / max) * 100, 2); // Minimum 2% to show something
  };

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}>
        {t('noData')}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>{t('conversions')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>{t('apiCalls')}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute inset-y-0 left-0 w-10 flex flex-col justify-between text-xs text-muted-foreground py-1">
          <span>{maxConversions}</span>
          <span>{Math.round(maxConversions / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars container */}
        <div className="ms-12 h-full flex items-end gap-1">
          {data.map((day, index) => {
            const { day: dayName, dayNum } = formatDate(day.date);
            const conversionHeight = getBarHeight(day.conversions, maxConversions);
            const apiCallHeight = getBarHeight(day.apiCalls, maxApiCalls);

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center group">
                {/* Bars */}
                <div className="w-full flex justify-center gap-0.5 h-40 items-end">
                  {/* Conversion bar */}
                  <div
                    className="w-2/5 bg-primary rounded-t transition-all hover:opacity-80 relative"
                    style={{ height: `${conversionHeight}%` }}
                    title={`${t('conversions')}: ${day.conversions}`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow whitespace-nowrap z-10">
                      {day.conversions}
                    </div>
                  </div>

                  {/* API calls bar */}
                  <div
                    className="w-2/5 bg-blue-500 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${apiCallHeight}%` }}
                    title={`${t('apiCalls')}: ${day.apiCalls}`}
                  />
                </div>

                {/* X-axis label */}
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  {data.length <= 7 ? (
                    <span>{dayName}</span>
                  ) : index % 2 === 0 ? (
                    <span>{dayNum}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary below chart */}
      <div className="flex justify-center gap-8 text-sm text-muted-foreground pt-2 border-t">
        <div>
          <span className="font-medium text-foreground">
            {data.reduce((sum, d) => sum + d.conversions, 0)}
          </span>{' '}
          {t('totalConversions')}
        </div>
        <div>
          <span className="font-medium text-foreground">
            {data.reduce((sum, d) => sum + d.apiCalls, 0)}
          </span>{' '}
          {t('totalApiCalls')}
        </div>
      </div>
    </div>
  );
}
