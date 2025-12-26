'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Zap, Upload, Download } from 'lucide-react';

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

interface ConversionStatsProps {
  summary: AnalyticsSummary;
}

export function ConversionStats({ summary }: ConversionStatsProps) {
  const t = useTranslations('dashboard.analytics');

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
    },
    {
      label: t('uploadsThisWeek'),
      value: summary.thisWeek.fileUploads,
      sublabel: t('files'),
      icon: Upload,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: t('downloadsThisWeek'),
      value: summary.thisWeek.fileDownloads,
      sublabel: t('files'),
      icon: Download,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.sublabel}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
