'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileJson, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface AnalyticsHistory {
  daily: DailyUsageData[];
  startDate: string;
  endDate: string;
  totalDays: number;
}

type ExportFormat = 'csv' | 'json';

interface ExportDialogProps {
  data: AnalyticsHistory | null;
  disabled?: boolean;
}

export function ExportDialog({ data, disabled }: ExportDialogProps) {
  const t = useTranslations('dashboard.analytics');
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!data) return;

    setExporting(true);

    try {
      // Simulate a brief delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Date',
          'Conversions',
          'API Calls',
          'File Uploads',
          'File Downloads',
          'Templates Used',
          'Batch Conversions',
          'Storage Used (bytes)',
        ];

        const rows = data.daily.map((day) => [
          day.date,
          day.conversions,
          day.apiCalls,
          day.fileUploads,
          day.fileDownloads,
          day.templatesUsed,
          day.batchConversions,
          day.storageUsed,
        ]);

        content = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
      } else {
        // Generate JSON
        const exportData = {
          exportDate: new Date().toISOString(),
          dateRange: {
            start: data.startDate,
            end: data.endDate,
            totalDays: data.totalDays,
          },
          summary: {
            totalConversions: data.daily.reduce((sum, d) => sum + d.conversions, 0),
            totalApiCalls: data.daily.reduce((sum, d) => sum + d.apiCalls, 0),
            totalFileUploads: data.daily.reduce((sum, d) => sum + d.fileUploads, 0),
            totalFileDownloads: data.daily.reduce((sum, d) => sum + d.fileDownloads, 0),
            totalTemplatesUsed: data.daily.reduce((sum, d) => sum + d.templatesUsed, 0),
            totalBatchConversions: data.daily.reduce((sum, d) => sum + d.batchConversions, 0),
          },
          daily: data.daily,
        };

        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics-${data.startDate}-to-${data.endDate}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success(t('exportSuccess'), {
        description: t('exportSuccessDescription', { format: format.toUpperCase() }),
      });

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('exportError'), {
        description: t('exportErrorDescription'),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || !data}>
          <Download className="h-4 w-4 me-2" aria-hidden="true" />
          {t('export')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('exportTitle')}</DialogTitle>
          <DialogDescription>{t('exportDescription')}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">{t('exportFormat')}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                format === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
              aria-pressed={format === 'csv'}
            >
              {format === 'csv' && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" aria-hidden="true" />
              )}
              <FileText
                className={cn(
                  'h-8 w-8 mb-2',
                  format === 'csv' ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
              <span className="font-medium">CSV</span>
              <span className="text-xs text-muted-foreground mt-1">{t('csvDescription')}</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('json')}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                format === 'json'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
              aria-pressed={format === 'json'}
            >
              {format === 'json' && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" aria-hidden="true" />
              )}
              <FileJson
                className={cn(
                  'h-8 w-8 mb-2',
                  format === 'json' ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
              <span className="font-medium">JSON</span>
              <span className="text-xs text-muted-foreground mt-1">{t('jsonDescription')}</span>
            </button>
          </div>

          {data && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('exportDataRange', {
                  start: new Date(data.startDate).toLocaleDateString(),
                  end: new Date(data.endDate).toLocaleDateString(),
                  days: data.totalDays,
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleExport} disabled={exporting || !data}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden="true" />
                {t('exporting')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 me-2" aria-hidden="true" />
                {t('exportNow')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
