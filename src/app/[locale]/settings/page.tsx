'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';
import { ThemeMode, DocumentTheme, PageSize, Orientation } from '@/types';
import { RotateCcw, Monitor, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tThemes = useTranslations('themes');
  const tPageSettings = useTranslations('pageSettings');

  const {
    editorSettings,
    setEditorSettings,
    defaultDocumentTheme,
    setDefaultDocumentTheme,
    defaultPageSize,
    setDefaultPageSize,
    defaultOrientation,
    setDefaultOrientation,
    resetToDefaults,
  } = useSettingsStore();

  const { mode, setMode } = useThemeStore();

  const handleResetConfirm = () => {
    if (window.confirm(t('resetConfirm'))) {
      resetToDefaults();
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      {/* Appearance Section */}
      <Card className="mb-6">
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
        </CardContent>
      </Card>

      {/* Editor Settings Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('editor')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('fontSize')}</Label>
              <p className="text-sm text-muted-foreground">{editorSettings.fontSize}px</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditorSettings({ fontSize: Math.max(10, editorSettings.fontSize - 2) })
                }
              >
                -
              </Button>
              <span className="w-10 text-center">{editorSettings.fontSize}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditorSettings({ fontSize: Math.min(24, editorSettings.fontSize + 2) })
                }
              >
                +
              </Button>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>{t('fontFamily')}</Label>
            <Select
              value={editorSettings.fontFamily}
              onValueChange={(value) => setEditorSettings({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monospace">Monospace</SelectItem>
                <SelectItem value="'Fira Code', monospace">Fira Code</SelectItem>
                <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono</SelectItem>
                <SelectItem value="'Source Code Pro', monospace">Source Code Pro</SelectItem>
                <SelectItem value="Consolas, monospace">Consolas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tab Size */}
          <div className="space-y-2">
            <Label>{t('tabSize')}</Label>
            <Select
              value={editorSettings.tabSize.toString()}
              onValueChange={(value) => setEditorSettings({ tabSize: parseInt(value) })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <Label>{t('wordWrap')}</Label>
            <Switch
              checked={editorSettings.wordWrap}
              onCheckedChange={(checked) => setEditorSettings({ wordWrap: checked })}
            />
          </div>

          {/* Line Numbers */}
          <div className="flex items-center justify-between">
            <Label>{t('lineNumbers')}</Label>
            <Switch
              checked={editorSettings.lineNumbers}
              onCheckedChange={(checked) => setEditorSettings({ lineNumbers: checked })}
            />
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between">
            <Label>{t('minimap')}</Label>
            <Switch
              checked={editorSettings.minimap}
              onCheckedChange={(checked) => setEditorSettings({ minimap: checked })}
            />
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <Label>{t('autoSave')}</Label>
            <Switch
              checked={editorSettings.autoSave}
              onCheckedChange={(checked) => setEditorSettings({ autoSave: checked })}
            />
          </div>

          {/* Auto Save Interval */}
          {editorSettings.autoSave && (
            <div className="space-y-2">
              <Label>{t('autoSaveInterval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={editorSettings.autoSaveInterval}
                  onChange={(e) =>
                    setEditorSettings({ autoSaveInterval: parseInt(e.target.value) || 30 })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('seconds')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Settings Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('defaults')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <SelectItem value="github">{tThemes('builtIn.github')}</SelectItem>
                <SelectItem value="academic">{tThemes('builtIn.academic')}</SelectItem>
                <SelectItem value="minimal">{tThemes('builtIn.minimal')}</SelectItem>
                <SelectItem value="dark">{tThemes('builtIn.dark')}</SelectItem>
                <SelectItem value="professional">{tThemes('builtIn.professional')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <SelectItem value="a4">{tPageSettings('pageSizes.a4')}</SelectItem>
                <SelectItem value="letter">{tPageSettings('pageSizes.letter')}</SelectItem>
                <SelectItem value="legal">{tPageSettings('pageSizes.legal')}</SelectItem>
                <SelectItem value="a3">{tPageSettings('pageSizes.a3')}</SelectItem>
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

      {/* Reset Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">{t('reset')}</CardTitle>
          <CardDescription>{t('resetConfirm')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleResetConfirm}>
            <RotateCcw className="h-4 w-4 me-2" />
            {t('reset')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
