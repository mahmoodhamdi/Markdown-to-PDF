'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCode, FileText, FileSpreadsheet, FileCheck, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateUsageData {
  template: string;
  count: number;
  percentage: number;
}

interface TemplateUsageProps {
  data?: TemplateUsageData[];
  loading?: boolean;
  totalTemplatesUsed?: number;
}

// Template icon mapping
const TEMPLATE_ICONS: Record<string, typeof FileCode> = {
  resume: FileText,
  'meeting-notes': FileSpreadsheet,
  readme: FileCode,
  report: FileCheck,
  default: File,
};

// Template color mapping
const TEMPLATE_COLORS: Record<string, { bg: string; text: string }> = {
  resume: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  'meeting-notes': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  readme: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  report: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  default: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
};

// Default mock data - used when no real data is available
const getDefaultTemplateUsage = (totalUsed: number = 0): TemplateUsageData[] => {
  if (totalUsed === 0) {
    return [];
  }
  return [
    { template: 'resume', count: Math.round(totalUsed * 0.4), percentage: 40 },
    { template: 'meeting-notes', count: Math.round(totalUsed * 0.35), percentage: 35 },
    { template: 'readme', count: Math.round(totalUsed * 0.15), percentage: 15 },
    { template: 'report', count: Math.round(totalUsed * 0.1), percentage: 10 },
  ];
};

export function TemplateUsage({ data, loading, totalTemplatesUsed = 0 }: TemplateUsageProps) {
  const t = useTranslations('dashboard.analytics');
  const tTemplates = useTranslations('templates');

  // Use provided data or fall back to mock data
  const templates = data && data.length > 0 ? data : getDefaultTemplateUsage(totalTemplatesUsed);

  // Sort by count (most used first)
  const sortedTemplates = [...templates].sort((a, b) => b.count - a.count);

  // Get template display name
  const getTemplateName = (template: string): string => {
    const templateKey = template.toLowerCase().replace(/\s+/g, '-');

    // Try to get translated template name
    try {
      const translated = tTemplates(`${templateKey}.name` as keyof typeof tTemplates);
      if (translated && !translated.includes('.name')) return translated;
    } catch {
      // Fall back to formatted name
    }

    // Format the template name: "meeting-notes" -> "Meeting Notes"
    return template
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get template icon
  const getTemplateIcon = (template: string): typeof FileCode => {
    const templateKey = template.toLowerCase().replace(/\s+/g, '-');
    return TEMPLATE_ICONS[templateKey] || TEMPLATE_ICONS.default;
  };

  // Get template colors
  const getTemplateColors = (template: string): { bg: string; text: string } => {
    const templateKey = template.toLowerCase().replace(/\s+/g, '-');
    return TEMPLATE_COLORS[templateKey] || TEMPLATE_COLORS.default;
  };

  const hasData = sortedTemplates.some((t) => t.count > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">{t('topTemplates')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-1">
            {sortedTemplates.map((template, index) => {
              const Icon = getTemplateIcon(template.template);
              const colors = getTemplateColors(template.template);

              return (
                <div
                  key={template.template}
                  className="flex justify-between items-center py-2.5 border-b last:border-0 group hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-medium w-4">{index + 1}.</span>
                    <div className={cn('p-1.5 rounded', colors.bg)}>
                      <Icon className={cn('h-4 w-4', colors.text)} aria-hidden="true" />
                    </div>
                    <span className="font-medium text-sm">{getTemplateName(template.template)}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    <span className="font-semibold">{template.count.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1">{t('uses')}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">({template.percentage}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm">{t('noTemplateUsage')}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">{t('templateUsageNote')}</p>
      </CardContent>
    </Card>
  );
}
