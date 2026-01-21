'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Calendar, Palette, TrendingUp } from 'lucide-react';
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

interface AnalyticsSummaryCardProps {
  data: DailyUsageData[];
  mostUsedTheme?: string;
  loading?: boolean;
}

export function AnalyticsSummaryCard({ data, mostUsedTheme, loading }: AnalyticsSummaryCardProps) {
  const t = useTranslations('dashboard.analytics');
  const tThemes = useTranslations('themes.builtIn');

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const totalConversions = data.reduce((sum, d) => sum + d.conversions, 0);

  // Find peak day
  const peakDay = data.reduce(
    (max, day) => (day.conversions > max.conversions ? day : max),
    data[0] || { date: '', conversions: 0 }
  );

  const peakDayFormatted = peakDay?.date
    ? new Date(peakDay.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : '-';

  // Get theme display name
  const getThemeName = (theme: string): string => {
    if (!theme) return '-';
    const themeKey = theme.toLowerCase();

    try {
      const translated = tThemes(themeKey as keyof typeof tThemes);
      if (translated && translated !== themeKey) return translated;
    } catch {
      // Fall back to capitalized name
    }

    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  const summaryItems = [
    {
      icon: TrendingUp,
      label: t('totalConversionsThisMonth'),
      value: totalConversions.toLocaleString(),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Calendar,
      label: t('peakDay'),
      value: peakDayFormatted,
      sublabel: peakDay?.conversions
        ? `${peakDay.conversions} ${t('conversions').toLowerCase()}`
        : undefined,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Palette,
      label: t('favoriteTheme'),
      value: getThemeName(mostUsedTheme || ''),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">{t('quickSummary')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg shrink-0', item.bgColor)}>
                  <Icon className={cn('h-5 w-5', item.color)} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                  <p className="font-semibold text-sm sm:text-base truncate">{item.value}</p>
                  {item.sublabel && (
                    <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
