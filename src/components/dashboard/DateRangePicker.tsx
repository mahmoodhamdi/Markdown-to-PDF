'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRangePreset = '7' | '14' | '30' | '90';

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  className?: string;
}

interface Preset {
  value: DateRangePreset;
  labelKey: string;
  days: number;
}

const PRESETS: Preset[] = [
  { value: '7', labelKey: 'last7Days', days: 7 },
  { value: '14', labelKey: 'last14Days', days: 14 },
  { value: '30', labelKey: 'last30Days', days: 30 },
  { value: '90', labelKey: 'last90Days', days: 90 },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const t = useTranslations('dashboard.analytics');

  // Get date range description
  const getDateRangeDescription = (days: number): string => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className={cn('space-y-1', className)}>
      <Select value={value} onValueChange={(val) => onChange(val as DateRangePreset)}>
        <SelectTrigger className="min-w-[160px]" aria-label={t('selectDateRange')}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              <div className="flex flex-col">
                <span>{t(preset.labelKey as keyof typeof t)}</span>
                <span className="text-xs text-muted-foreground">
                  {getDateRangeDescription(preset.days)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
