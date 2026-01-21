'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface StorageQuotaCardProps {
  used: number;
  limit: number;
  usedFormatted?: string;
  limitFormatted?: string;
  loading?: boolean;
  storageEnabled?: boolean;
}

export function StorageQuotaCard({
  used,
  limit,
  usedFormatted,
  limitFormatted,
  loading = false,
  storageEnabled = true,
}: StorageQuotaCardProps) {
  const t = useTranslations('dashboard.files');

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!storageEnabled) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            {t('storage')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('upgradeRequired')}</p>
          <Button asChild size="sm" className="w-full">
            <Link href="/pricing">
              <TrendingUp className="h-4 w-4 me-2" />
              {t('upgrade')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const percentage =
    limit === Infinity || limit === 0 ? 0 : Math.min(Math.round((used / limit) * 100), 100);

  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  const displayUsed = usedFormatted || formatBytes(used);
  const displayLimit = limit === Infinity ? t('unlimited') : limitFormatted || formatBytes(limit);

  return (
    <Card className={isAtLimit ? 'border-destructive' : isNearLimit ? 'border-yellow-500' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          {t('storage')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={percentage}
          className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {displayUsed} {t('of')} {displayLimit}
          </span>
          <span
            className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600' : ''}`}
          >
            {percentage}%
          </span>
        </div>
        {isNearLimit && (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href="/pricing">
              <TrendingUp className="h-4 w-4 me-2" />
              {t('upgrade')}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes === Infinity) return 'Unlimited';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
