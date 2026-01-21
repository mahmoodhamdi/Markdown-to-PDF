'use client';

import { useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  showPercentage?: boolean;
  className?: string;
}

export function UsageBar({
  label,
  used,
  limit,
  unit = '',
  showPercentage = true,
  className,
}: UsageBarProps) {
  const t = useTranslations('dashboard.subscription');

  const isUnlimited = limit === Infinity || limit === 0;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isHigh = percentage >= 80;
  const isCritical = percentage >= 95;

  const formatValue = (value: number) => {
    if (value === Infinity) return t('unlimited');
    if (unit === 'MB' || unit === 'GB') {
      return `${value}${unit}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            'font-medium',
            isCritical && 'text-destructive',
            isHigh && !isCritical && 'text-yellow-600 dark:text-yellow-400'
          )}
        >
          {formatValue(used)} / {formatValue(limit)}
          {showPercentage && !isUnlimited && (
            <span className="text-muted-foreground ms-1">({percentage}%)</span>
          )}
        </span>
      </div>
      <Progress
        value={isUnlimited ? 0 : percentage}
        className={cn(
          'h-2',
          isCritical && '[&>div]:bg-destructive',
          isHigh && !isCritical && '[&>div]:bg-yellow-500'
        )}
      />
    </div>
  );
}
