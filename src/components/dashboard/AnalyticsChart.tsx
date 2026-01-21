'use client';

import { useState, memo, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export const AnalyticsChart = memo(function AnalyticsChart({
  data,
  className,
}: AnalyticsChartProps) {
  const t = useTranslations('dashboard.analytics');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoize calculated values
  const { maxConversions, maxApiCalls, totalConversions, totalApiCalls } = useMemo(
    () => ({
      maxConversions: Math.max(...data.map((d) => d.conversions), 1),
      maxApiCalls: Math.max(...data.map((d) => d.apiCalls), 1),
      totalConversions: data.reduce((sum, d) => sum + d.conversions, 0),
      totalApiCalls: data.reduce((sum, d) => sum + d.apiCalls, 0),
    }),
    [data]
  );

  // Memoized format functions
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, dayNum, month };
  }, []);

  const formatFullDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Calculate percentage for bar height
  const getBarHeight = useCallback((value: number, max: number) => {
    return Math.max((value / max) * 100, 2); // Minimum 2% to show something
  }, []);

  // Generate accessibility description
  const getChartDescription = useCallback(() => {
    if (data.length === 0) return t('noData');
    const avgConversions = Math.round(totalConversions / data.length);
    const avgApiCalls = Math.round(totalApiCalls / data.length);
    return `${t('conversions')}: ${totalConversions} ${t('totalConversions')} (${avgConversions} ${t('dailyAverage')}). ${t('apiCalls')}: ${totalApiCalls} ${t('totalApiCalls')} (${avgApiCalls} ${t('dailyAverage')}).`;
  }, [data.length, t, totalConversions, totalApiCalls]);

  if (data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}
        role="img"
        aria-label={t('noData')}
      >
        {t('noData')}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn('space-y-4', className)}>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" aria-hidden="true" />
            <span>{t('conversions')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" aria-hidden="true" />
            <span>{t('apiCalls')}</span>
          </div>
        </div>

        {/* Chart with accessibility */}
        <div
          className="relative h-48 sm:h-56 md:h-64"
          role="img"
          aria-label={getChartDescription()}
        >
          {/* Y-axis labels */}
          <div
            className="absolute inset-y-0 left-0 w-8 sm:w-10 flex flex-col justify-between text-xs text-muted-foreground py-1"
            aria-hidden="true"
          >
            <span>{maxConversions}</span>
            <span>{Math.round(maxConversions / 2)}</span>
            <span>0</span>
          </div>

          {/* Bars container with horizontal scroll on mobile */}
          <div className="ms-10 sm:ms-12 h-full overflow-x-auto">
            <div
              className={cn(
                'h-full flex items-end gap-0.5 sm:gap-1',
                data.length > 14 ? 'min-w-[600px]' : ''
              )}
            >
              {data.map((day, index) => {
                const { day: dayName, dayNum, month } = formatDate(day.date);
                const conversionHeight = getBarHeight(day.conversions, maxConversions);
                const apiCallHeight = getBarHeight(day.apiCalls, maxApiCalls);
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[24px] flex flex-col items-center"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                  >
                    {/* Bars with Tooltip */}
                    <Tooltip open={isHovered}>
                      <TooltipTrigger asChild>
                        <div
                          className="w-full flex justify-center gap-0.5 h-36 sm:h-40 md:h-48 items-end cursor-pointer"
                          tabIndex={0}
                          role="button"
                          aria-label={`${formatFullDate(day.date)}: ${day.conversions} ${t('conversions')}, ${day.apiCalls} ${t('apiCalls')}`}
                        >
                          {/* Conversion bar */}
                          <div
                            className={cn(
                              'w-2/5 max-w-4 bg-primary rounded-t transition-all',
                              isHovered ? 'opacity-100 scale-105' : 'opacity-90'
                            )}
                            style={{ height: `${conversionHeight}%` }}
                            aria-hidden="true"
                          />

                          {/* API calls bar */}
                          <div
                            className={cn(
                              'w-2/5 max-w-4 bg-blue-500 rounded-t transition-all',
                              isHovered ? 'opacity-100 scale-105' : 'opacity-90'
                            )}
                            style={{ height: `${apiCallHeight}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-50">
                        <div className="space-y-1.5 text-sm">
                          <p className="font-semibold border-b pb-1">{formatFullDate(day.date)}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-primary" />
                            <span>
                              {t('conversions')}: <strong>{day.conversions}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-blue-500" />
                            <span>
                              {t('apiCalls')}: <strong>{day.apiCalls}</strong>
                            </span>
                          </div>
                          {day.batchConversions > 0 && (
                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              {t('batchConversions')}: {day.batchConversions}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* X-axis label */}
                    <div
                      className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 text-center"
                      aria-hidden="true"
                    >
                      {data.length <= 7 ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{dayName}</span>
                          <span className="text-[8px] sm:text-[10px]">{dayNum}</span>
                        </div>
                      ) : data.length <= 14 ? (
                        index % 2 === 0 && (
                          <div className="flex flex-col">
                            <span>{dayNum}</span>
                            <span className="text-[8px] sm:text-[10px]">{month}</span>
                          </div>
                        )
                      ) : (
                        index % 3 === 0 && <span>{dayNum}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary below chart */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 text-sm text-muted-foreground pt-3 border-t"
          aria-live="polite"
        >
          <div className="text-center">
            <span className="font-semibold text-foreground text-lg">{totalConversions}</span>{' '}
            <span>{t('totalConversions')}</span>
          </div>
          <div className="text-center">
            <span className="font-semibold text-foreground text-lg">{totalApiCalls}</span>{' '}
            <span>{t('totalApiCalls')}</span>
          </div>
        </div>

        {/* Screen reader table alternative */}
        <table className="sr-only">
          <caption>{t('conversionChart')}</caption>
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('conversions')}</th>
              <th>{t('apiCalls')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date}>
                <td>{formatFullDate(day.date)}</td>
                <td>{day.conversions}</td>
                <td>{day.apiCalls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
});
