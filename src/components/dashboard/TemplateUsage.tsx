'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCode } from 'lucide-react';

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

interface TemplateUsageProps {
  summary: AnalyticsSummary;
}

// Mock template usage data - in production this would come from analytics
const getTemplateUsage = (summary: AnalyticsSummary) => {
  const totalTemplates = summary.thisMonth.templatesUsed;
  return [
    { name: 'Resume', uses: Math.round(totalTemplates * 0.4) || 0 },
    { name: 'Meeting Notes', uses: Math.round(totalTemplates * 0.35) || 0 },
    { name: 'README', uses: Math.round(totalTemplates * 0.15) || 0 },
    { name: 'Report', uses: Math.round(totalTemplates * 0.1) || 0 },
  ];
};

export function TemplateUsage({ summary }: TemplateUsageProps) {
  const t = useTranslations('dashboard.analytics');
  const templates = getTemplateUsage(summary);

  const hasData = templates.some((t) => t.uses > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">{t('topTemplates')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {templates.map((template, index) => (
              <div
                key={template.name}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <span className="text-sm">
                  <span className="font-medium text-muted-foreground">{index + 1}.</span>{' '}
                  {template.name}
                </span>
                <span className="text-sm font-medium">
                  {template.uses} {t('uses')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noTemplateUsage')}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">{t('templateUsageNote')}</p>
      </CardContent>
    </Card>
  );
}
