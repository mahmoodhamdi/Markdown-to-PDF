'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SettingRow } from './SettingRow';

const fontFamilies = [
  { value: 'monospace', label: 'Monospace' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: 'Consolas, monospace', label: 'Consolas' },
];

export function EditorSettings() {
  const t = useTranslations('settings');
  const { editorSettings, setEditorSettings } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editor')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Size */}
        <SettingRow label={t('fontSize')} description={`${editorSettings.fontSize}px`}>
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
        </SettingRow>

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
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
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
        <SettingRow label={t('wordWrap')}>
          <Switch
            checked={editorSettings.wordWrap}
            onCheckedChange={(checked) => setEditorSettings({ wordWrap: checked })}
          />
        </SettingRow>

        {/* Line Numbers */}
        <SettingRow label={t('lineNumbers')}>
          <Switch
            checked={editorSettings.lineNumbers}
            onCheckedChange={(checked) => setEditorSettings({ lineNumbers: checked })}
          />
        </SettingRow>

        {/* Minimap */}
        <SettingRow label={t('minimap')}>
          <Switch
            checked={editorSettings.minimap}
            onCheckedChange={(checked) => setEditorSettings({ minimap: checked })}
          />
        </SettingRow>

        {/* Auto Save */}
        <SettingRow label={t('autoSave')}>
          <Switch
            checked={editorSettings.autoSave}
            onCheckedChange={(checked) => setEditorSettings({ autoSave: checked })}
          />
        </SettingRow>

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
                  setEditorSettings({
                    autoSaveInterval: Math.max(5, Math.min(300, parseInt(e.target.value) || 30)),
                  })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{t('seconds')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
