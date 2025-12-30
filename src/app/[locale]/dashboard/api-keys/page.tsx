'use client';

import { useTranslations } from 'next-intl';
import { ApiKeyList } from '@/components/dashboard/ApiKeyList';

export default function ApiKeysPage() {
  const t = useTranslations('dashboard.apiKeys');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('description')}</p>
      </div>

      <ApiKeyList />
    </div>
  );
}
