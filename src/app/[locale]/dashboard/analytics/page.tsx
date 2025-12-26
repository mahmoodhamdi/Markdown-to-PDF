'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, BarChart3 } from 'lucide-react';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { ConversionStats } from '@/components/dashboard/ConversionStats';
import { ThemeUsage } from '@/components/dashboard/ThemeUsage';
import { TemplateUsage } from '@/components/dashboard/TemplateUsage';

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

interface AnalyticsHistory {
  daily: DailyUsageData[];
  startDate: string;
  endDate: string;
  totalDays: number;
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const t = useTranslations('dashboard.analytics');

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [history, setHistory] = useState<AnalyticsHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7');

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const [summaryRes, historyRes] = await Promise.all([
          fetch('/api/analytics/summary'),
          fetch(`/api/analytics/history?days=${dateRange}`),
        ]);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.summary);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, dateRange]);

  const handleExportCSV = () => {
    if (!history) return;

    const headers = [
      'Date',
      'Conversions',
      'API Calls',
      'File Uploads',
      'File Downloads',
      'Templates Used',
      'Batch Conversions',
    ];
    const rows = history.daily.map((day) => [
      day.date,
      day.conversions,
      day.apiCalls,
      day.fileUploads,
      day.fileDownloads,
      day.templatesUsed,
      day.batchConversions,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${history.startDate}-to-${history.endDate}.csv`;
    link.click();
  };

  if (status === 'loading' || loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onValueChange={(value: '7' | '14' | '30') => setDateRange(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('last7Days')}</SelectItem>
              <SelectItem value="14">{t('last14Days')}</SelectItem>
              <SelectItem value="30">{t('last30Days')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV} disabled={!history}>
            <Download className="h-4 w-4 me-2" />
            {t('exportCSV')}
          </Button>
        </div>
      </div>

      {/* Conversion Stats */}
      {summary && <ConversionStats summary={summary} />}

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
        {summary && <ThemeUsage summary={summary} />}
        {summary && <TemplateUsage summary={summary} />}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
