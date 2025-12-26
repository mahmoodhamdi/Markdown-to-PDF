'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ onDismiss }: EmailVerificationBannerProps) {
  const t = useTranslations('verification');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleResend = async () => {
    setSending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.alreadyVerified) {
          toast.success(t('alreadyVerified'));
          setDismissed(true);
          onDismiss?.();
        } else {
          setSent(true);
          toast.success(t('resendSuccess'));
        }
      } else {
        if (data.code === 'rate_limit') {
          toast.error(t('rateLimited'));
        } else {
          toast.error(data.error || t('resendFailed'));
        }
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(t('resendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
            {t('bannerTitle')}
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {t('bannerDescription')}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {sent ? (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                {t('emailSent')}
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={sending}
                className="border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  t('resendEmail')
                )}
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 -mt-1 -me-1 h-8 w-8 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('dismiss')}</span>
        </Button>
      </div>
    </div>
  );
}
