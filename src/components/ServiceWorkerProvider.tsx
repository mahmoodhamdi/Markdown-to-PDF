'use client';

import { useServiceWorker, skipWaiting } from '@/hooks/useServiceWorker';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { updateAvailable, isOffline } = useServiceWorker();
  const t = useTranslations('common');

  useEffect(() => {
    if (updateAvailable) {
      toast.info(t('updateAvailable'), {
        duration: Infinity,
        action: {
          label: t('refresh'),
          onClick: () => skipWaiting(),
        },
      });
    }
  }, [updateAvailable, t]);

  useEffect(() => {
    if (isOffline) {
      toast.warning(t('offline'), {
        duration: 5000,
      });
    }
  }, [isOffline, t]);

  return <>{children}</>;
}
