'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Monitor, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useThemeStore } from '@/stores/theme-store';
import { useSettingsStore } from '@/stores/settings-store';
import { DocumentTheme, CodeTheme } from '@/types';

const documentThemes: DocumentTheme[] = [
  'github',
  'academic',
  'minimal',
  'dark',
  'professional',
  'elegant',
  'modern',
  'newsletter',
];

const codeThemes: CodeTheme[] = [
  'github-light',
  'github-dark',
  'monokai',
  'dracula',
  'nord',
  'one-dark',
  'vs-code',
];

export function AppearanceSettings() {
  const t = useTranslations('settings');
  const tThemes = useTranslations('themes');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const { mode, setMode, codeTheme, setCodeTheme } = useThemeStore();
  const { defaultDocumentTheme, setDefaultDocumentTheme } = useSettingsStore();

  // Get current locale from pathname
  const currentLocale = pathname.startsWith('/ar') ? 'ar' : 'en';

  const handleLanguageChange = (locale: string) => {
    const newPath = pathname.replace(/^\/(en|ar)/, `/${locale}`);
    router.push(newPath);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('appearance')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Mode */}
        <div className="space-y-2">
          <Label>{t('theme')}</Label>
          <div className="flex gap-2">
            <Button
              variant={mode === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('light')}
              className="flex-1"
            >
              <Sun className="h-4 w-4 me-2" />
              {t('themes.light')}
            </Button>
            <Button
              variant={mode === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('dark')}
              className="flex-1"
            >
              <Moon className="h-4 w-4 me-2" />
              {t('themes.dark')}
            </Button>
            <Button
              variant={mode === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('system')}
              className="flex-1"
            >
              <Monitor className="h-4 w-4 me-2" />
              {t('themes.system')}
            </Button>
          </div>
        </div>

        {/* Default Document Theme */}
        <div className="space-y-2">
          <Label>{t('defaultTheme')}</Label>
          <Select
            value={defaultDocumentTheme}
            onValueChange={(value) => setDefaultDocumentTheme(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentThemes.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {tThemes(`builtIn.${theme}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Code Theme */}
        <div className="space-y-2">
          <Label>{tThemes('codeThemes.title')}</Label>
          <Select
            value={codeTheme}
            onValueChange={(value) => setCodeTheme(value as CodeTheme)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {codeThemes.map((theme) => {
                const themeKey = theme.replace('-', '') as
                  | 'githubDark'
                  | 'githubLight'
                  | 'monokai'
                  | 'dracula'
                  | 'nord'
                  | 'oneDark'
                  | 'vsCode';
                return (
                  <SelectItem key={theme} value={theme}>
                    {tThemes(`codeThemes.${themeKey}`)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label>{t('language')}</Label>
          <Select value={currentLocale} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{tCommon('english')}</SelectItem>
              <SelectItem value="ar">{tCommon('arabic')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
