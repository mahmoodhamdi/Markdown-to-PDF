'use client';

import { useTranslations } from 'next-intl';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { ApiKeyList } from '@/components/dashboard/ApiKeyList';

export default function ApiKeysPage() {
  const t = useTranslations('dashboard.apiKeys');

  return (
    <div className="container py-8">
      <div className="flex gap-8">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground mt-1">{t('description')}</p>
            </div>

            <ApiKeyList />
          </div>
        </main>
      </div>
    </div>
  );
}
