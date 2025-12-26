'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';

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

interface ThemeUsageProps {
  summary: AnalyticsSummary;
}

// Mock theme usage data - in production this would come from analytics
const getThemeUsage = () => {
  return [
    { name: 'GitHub', percentage: 45, color: 'bg-primary' },
    { name: 'Academic', percentage: 28, color: 'bg-blue-500' },
    { name: 'Minimal', percentage: 18, color: 'bg-green-500' },
    { name: 'Other', percentage: 9, color: 'bg-gray-400' },
  ];
};

export function ThemeUsage({ summary: _summary }: ThemeUsageProps) {
  const t = useTranslations('dashboard.analytics');
  const themes = getThemeUsage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">{t('topThemes')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {themes.map((theme, index) => (
            <div key={theme.name} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>
                  <span className="font-medium">{index + 1}.</span> {theme.name}
                </span>
                <span className="text-muted-foreground">{theme.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${theme.color} rounded-full transition-all`}
                  style={{ width: `${theme.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">{t('themeUsageNote')}</p>
      </CardContent>
    </Card>
  );
}
