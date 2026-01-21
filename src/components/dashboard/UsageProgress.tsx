'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface UsageProgressProps {
  label: string;
  current: number;
  limit: number;
  unit?: string;
  showPercentage?: boolean;
  colorScheme?: 'default' | 'warning' | 'danger' | 'success';
}

export function UsageProgress({
  label,
  current,
  limit,
  unit = '',
  showPercentage = false,
  colorScheme = 'default',
}: UsageProgressProps) {
  const t = useTranslations('dashboard.usage');

  const isUnlimited = limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);

  // Determine color based on usage percentage or explicit colorScheme
  const getColorScheme = () => {
    if (colorScheme !== 'default') return colorScheme;
    if (isUnlimited) return 'success';
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'default';
  };

  const scheme = getColorScheme();

  const progressColors = {
    default: 'bg-primary',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  };

  const formatValue = (value: number): string => {
    if (value === Infinity) return '∞';
    return value.toLocaleString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatValue(current)}
          {unit && ` ${unit}`}
          {' / '}
          {isUnlimited ? t('unlimited') : `${formatValue(limit)}${unit ? ` ${unit}` : ''}`}
          {showPercentage && !isUnlimited && (
            <span className="ms-2 text-xs">({percentage.toFixed(0)}%)</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', progressColors[scheme])}
          style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
}
