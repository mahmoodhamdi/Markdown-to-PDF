'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeUsageData {
  theme: string;
  count: number;
  percentage: number;
}

interface ThemeUsageProps {
  data?: ThemeUsageData[];
  loading?: boolean;
}

// Theme color mapping
const THEME_COLORS: Record<string, string> = {
  github: 'bg-primary',
  academic: 'bg-blue-500',
  minimal: 'bg-green-500',
  dark: 'bg-gray-700',
  professional: 'bg-indigo-500',
  elegant: 'bg-purple-500',
  modern: 'bg-cyan-500',
  newsletter: 'bg-orange-500',
  other: 'bg-gray-400',
};

// Default mock data - used when no real data is available
const getDefaultThemeUsage = (): ThemeUsageData[] => {
  return [
    { theme: 'github', count: 45, percentage: 45 },
    { theme: 'academic', count: 28, percentage: 28 },
    { theme: 'minimal', count: 18, percentage: 18 },
    { theme: 'other', count: 9, percentage: 9 },
  ];
};

export function ThemeUsage({ data, loading }: ThemeUsageProps) {
  const t = useTranslations('dashboard.analytics');
  const tThemes = useTranslations('themes.builtIn');

  // Use provided data or fall back to mock data
  const themes = data && data.length > 0 ? data : getDefaultThemeUsage();

  // Sort by count (most used first)
  const sortedThemes = [...themes].sort((a, b) => b.count - a.count);

  // Get theme display name
  const getThemeName = (theme: string): string => {
    const themeKey = theme.toLowerCase();
    if (themeKey === 'other') return t('other');

    // Try to get translated theme name
    try {
      const translated = tThemes(themeKey as keyof typeof tThemes);
      if (translated && translated !== themeKey) return translated;
    } catch {
      // Fall back to capitalized theme name
    }

    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  // Get theme color
  const getThemeColor = (theme: string): string => {
    const themeKey = theme.toLowerCase();
    return THEME_COLORS[themeKey] || THEME_COLORS.other;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCount = sortedThemes.reduce((sum, t) => sum + t.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">{t('topThemes')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm">{t('noThemeUsage')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedThemes.map((theme, index) => (
              <div key={theme.theme} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">{index + 1}.</span>
                    <div
                      className={cn('w-3 h-3 rounded-sm', getThemeColor(theme.theme))}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{getThemeName(theme.theme)}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {theme.count.toLocaleString()} ({theme.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getThemeColor(theme.theme)
                    )}
                    style={{ width: `${theme.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={theme.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${getThemeName(theme.theme)}: ${theme.percentage}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">{t('themeUsageNote')}</p>
      </CardContent>
    </Card>
  );
}
