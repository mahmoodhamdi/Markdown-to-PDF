'use client';

import useSWR from 'swr';

/**
 * SWR fetcher function
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

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

interface ThemeUsageData {
  theme: string;
  count: number;
  percentage: number;
}

interface TemplateUsageData {
  template: string;
  count: number;
  percentage: number;
}

interface AnalyticsSummaryResponse {
  summary: AnalyticsSummary;
  themeUsage?: ThemeUsageData[];
  templateUsage?: TemplateUsageData[];
}

interface AnalyticsHistory {
  daily: DailyUsageData[];
  startDate: string;
  endDate: string;
  totalDays: number;
}

interface AnalyticsHistoryResponse {
  history: AnalyticsHistory;
}

/**
 * Hook for fetching analytics summary with SWR caching
 * - Revalidates on focus by default
 * - Dedupes requests within 60 seconds
 */
export function useAnalyticsSummary() {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsSummaryResponse>(
    '/api/analytics/summary',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60 seconds
      errorRetryCount: 2,
    }
  );

  return {
    summary: data?.summary,
    themeUsage: data?.themeUsage,
    templateUsage: data?.templateUsage,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching analytics history with SWR caching
 * @param days - Number of days of history to fetch
 */
export function useAnalyticsHistory(days: string = '7') {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsHistoryResponse>(
    `/api/analytics/history?days=${days}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60 seconds
      errorRetryCount: 2,
    }
  );

  return {
    history: data?.history,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export type {
  DailyUsageData,
  AnalyticsSummary,
  AnalyticsHistory,
  ThemeUsageData,
  TemplateUsageData,
};
