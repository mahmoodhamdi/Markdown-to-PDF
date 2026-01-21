'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useThemeStore } from '@/stores/theme-store';
import { getAllThemes, codeThemes } from '@/lib/themes/manager';
import { CodeTheme } from '@/types';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemesPage() {
  const t = useTranslations('themes');
  const { documentTheme, setDocumentTheme, codeTheme, setCodeTheme, customCss, setCustomCss } =
    useThemeStore();

  const themes = getAllThemes();
  const codeThemeIds = Object.keys(codeThemes) as CodeTheme[];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Document Themes */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t('currentTheme')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                documentTheme === theme.id && 'ring-2 ring-primary'
              )}
              onClick={() => setDocumentTheme(theme.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {t(`builtIn.${theme.id}`)}
                  </span>
                  {documentTheme === theme.id && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>{t(`builtIn.${theme.id}Desc`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'h-24 rounded-md border p-4 text-xs overflow-hidden',
                    `theme-${theme.id}`
                  )}
                >
                  <h4 className="font-bold">Preview Title</h4>
                  <p>This is a preview of the theme style...</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Code Themes */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t('codeThemes.title')}</h2>
        <div className="max-w-md">
          <Select value={codeTheme} onValueChange={(value) => setCodeTheme(value as CodeTheme)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {codeThemeIds.map((id) => {
                // Convert hyphenated-id to camelCase for translation key
                const translationKey = id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                return (
                  <SelectItem key={id} value={id}>
                    {t(`codeThemes.${translationKey}` as 'codeThemes.title') ||
                      id
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom CSS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('customCss')}</h2>
        <div className="space-y-4">
          <Textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder={t('customCssPlaceholder')}
            className="font-mono min-h-[200px]"
          />
          <p className="text-sm text-muted-foreground">
            Custom CSS will be applied on top of the selected theme.
          </p>
        </div>
      </div>
    </div>
  );
}
