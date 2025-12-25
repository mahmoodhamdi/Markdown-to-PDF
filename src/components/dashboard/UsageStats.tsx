'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageProgress } from './UsageProgress';
import { Clock } from 'lucide-react';
import { formatFileSize } from '@/lib/plans/config';

interface UsageData {
  conversions: number;
  apiCalls: number;
  storageUsed: number;
  filesUploaded: number;
}

interface UsageLimits {
  conversionsPerDay: number;
  apiCallsPerDay: number;
  cloudStorageBytes: number;
  maxBatchFiles: number;
}

interface UsageStatsProps {
  usage: UsageData;
  limits: UsageLimits;
  resetTime: string;
}

export function UsageStats({ usage, limits, resetTime }: UsageStatsProps) {
  const t = useTranslations('dashboard.usage');

  // Calculate time until reset
  const getTimeUntilReset = () => {
    const now = new Date();
    const reset = new Date(resetTime);
    const diffMs = reset.getTime() - now.getTime();

    if (diffMs <= 0) return t('resetsNow');

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return t('resetsIn', { hours, minutes });
    }
    return t('resetsInMinutes', { minutes });
  };

  // Format storage values
  const formatStorage = (bytes: number) => {
    return formatFileSize(bytes);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('todaysUsage')}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{getTimeUntilReset()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Limits */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">{t('dailyLimits')}</h4>

          <UsageProgress
            label={t('conversions')}
            current={usage.conversions}
            limit={limits.conversionsPerDay}
            showPercentage
          />

          <UsageProgress
            label={t('apiCalls')}
            current={usage.apiCalls}
            limit={limits.apiCallsPerDay}
            showPercentage
          />
        </div>

        {/* Storage */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">{t('storage')}</h4>

          <UsageProgress
            label={t('storageUsed')}
            current={usage.storageUsed}
            limit={limits.cloudStorageBytes}
            showPercentage
          />

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatStorage(usage.storageUsed)} {t('used')}</span>
            <span>
              {limits.cloudStorageBytes === Infinity
                ? t('unlimited')
                : `${formatStorage(limits.cloudStorageBytes)} ${t('total')}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
