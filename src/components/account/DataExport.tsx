'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function DataExport() {
  const t = useTranslations('account.export');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus('exporting');
    setError(null);

    try {
      const response = await fetch('/api/users/export');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export data');
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'user-data-export.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus('success');

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
      setStatus('error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">{t('includes')}:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('items.profile')}</li>
            <li>{t('items.files')}</li>
            <li>{t('items.conversions')}</li>
            <li>{t('items.analytics')}</li>
            <li>{t('items.teams')}</li>
          </ul>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleExport}
          disabled={status === 'exporting'}
          variant={status === 'success' ? 'outline' : 'default'}
          className="w-full sm:w-auto"
        >
          {status === 'exporting' && (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('exporting')}
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('success')}
            </>
          )}
          {(status === 'idle' || status === 'error') && (
            <>
              <Download className="h-4 w-4 mr-2" />
              {t('button')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
