'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2, CheckCircle, AlertCircle, FileText, FolderOpen, BarChart3, Archive } from 'lucide-react';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';
type ExportPhase = 'profile' | 'files' | 'analytics' | 'packaging';

const EXPORT_PHASES: ExportPhase[] = ['profile', 'files', 'analytics', 'packaging'];

const phaseIcons: Record<ExportPhase, React.ReactNode> = {
  profile: <FileText className="h-4 w-4" />,
  files: <FolderOpen className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  packaging: <Archive className="h-4 w-4" />,
};

export function DataExport() {
  const t = useTranslations('account.export');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<ExportPhase>('profile');
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Start simulated progress when exporting
  const startProgressSimulation = () => {
    setProgress(0);
    setCurrentPhase('profile');

    let currentProgress = 0;
    let phaseIndex = 0;

    progressInterval.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2; // Random increment 2-10%

      if (currentProgress >= 100) {
        currentProgress = 95; // Cap at 95% until actual completion
      }

      // Update phase based on progress
      const newPhaseIndex = Math.min(
        Math.floor((currentProgress / 100) * EXPORT_PHASES.length),
        EXPORT_PHASES.length - 1
      );

      if (newPhaseIndex !== phaseIndex) {
        phaseIndex = newPhaseIndex;
        setCurrentPhase(EXPORT_PHASES[phaseIndex]);
      }

      setProgress(currentProgress);
    }, 300);
  };

  const stopProgressSimulation = (success: boolean) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    if (success) {
      setProgress(100);
      setCurrentPhase('packaging');
    }
  };

  const handleExport = async () => {
    setStatus('exporting');
    setError(null);
    startProgressSimulation();

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

      stopProgressSimulation(true);
      setStatus('success');

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setCurrentPhase('profile');
      }, 3000);
    } catch (err) {
      console.error('Export error:', err);
      stopProgressSimulation(false);
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

        {/* Progress indicator */}
        {status === 'exporting' && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {phaseIcons[currentPhase]}
                <span className="font-medium">{t(`phase.${currentPhase}`)}</span>
              </div>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between gap-2">
              {EXPORT_PHASES.map((phase, index) => {
                const phaseProgress = (index / EXPORT_PHASES.length) * 100;
                const isComplete = progress > phaseProgress + 25;
                const isCurrent = currentPhase === phase;
                return (
                  <div
                    key={phase}
                    className={`flex items-center gap-1 text-xs ${
                      isComplete
                        ? 'text-green-600 dark:text-green-400'
                        : isCurrent
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <span className={`w-3 h-3 rounded-full border ${
                        isCurrent ? 'border-primary bg-primary/20' : 'border-muted-foreground'
                      }`} />
                    )}
                    <span className="hidden sm:inline">{t(`phase.${phase}`)}</span>
                  </div>
                );
              })}
            </div>
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
