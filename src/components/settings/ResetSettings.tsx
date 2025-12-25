'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settings-store';

export function ResetSettings() {
  const t = useTranslations('settings');
  const { resetToDefaults } = useSettingsStore();

  const handleReset = () => {
    if (window.confirm(t('resetConfirm'))) {
      resetToDefaults();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">{t('reset')}</CardTitle>
        <CardDescription>{t('resetConfirm')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 me-2" />
          {t('reset')}
        </Button>
      </CardContent>
    </Card>
  );
}
