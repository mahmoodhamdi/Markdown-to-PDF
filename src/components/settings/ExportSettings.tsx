'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { PageSize, Orientation } from '@/types';

const pageSizes: PageSize[] = ['a4', 'letter', 'legal', 'a3'];

export function ExportSettings() {
  const t = useTranslations('settings');
  const tPageSettings = useTranslations('pageSettings');

  const { defaultPageSize, setDefaultPageSize, defaultOrientation, setDefaultOrientation } =
    useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('defaults')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Page Size */}
        <div className="space-y-2">
          <Label>{t('defaultPageSize')}</Label>
          <Select
            value={defaultPageSize}
            onValueChange={(value) => setDefaultPageSize(value as PageSize)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {tPageSettings(`pageSizes.${size}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Orientation */}
        <div className="space-y-2">
          <Label>{t('defaultOrientation')}</Label>
          <Select
            value={defaultOrientation}
            onValueChange={(value) => setDefaultOrientation(value as Orientation)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">{tPageSettings('portrait')}</SelectItem>
              <SelectItem value="landscape">{tPageSettings('landscape')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
