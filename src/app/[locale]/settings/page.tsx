'use client';

import { useTranslations } from 'next-intl';
import {
  AppearanceSettings,
  EditorSettings,
  ExportSettings,
  ResetSettings,
} from '@/components/settings';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <div className="container py-8 max-w-3xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <div className="space-y-6">
        <AppearanceSettings />
        <EditorSettings />
        <ExportSettings />
        <ResetSettings />
      </div>
    </div>
  );
}
