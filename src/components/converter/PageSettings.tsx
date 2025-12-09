'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { PageSize, Orientation, PageNumberPosition } from '@/types';

export function PageSettingsForm() {
  const t = useTranslations('pageSettings');
  const { pageSettings, setPageSettings } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Page Size */}
      <div className="space-y-2">
        <Label>{t('pageSize')}</Label>
        <Select
          value={pageSettings.pageSize}
          onValueChange={(value) => setPageSettings({ pageSize: value as PageSize })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a4">{t('pageSizes.a4')}</SelectItem>
            <SelectItem value="letter">{t('pageSizes.letter')}</SelectItem>
            <SelectItem value="legal">{t('pageSizes.legal')}</SelectItem>
            <SelectItem value="a3">{t('pageSizes.a3')}</SelectItem>
            <SelectItem value="custom">{t('pageSizes.custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Size */}
      {pageSettings.pageSize === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Width (mm)</Label>
            <Input
              type="number"
              value={pageSettings.customWidth || 210}
              onChange={(e) =>
                setPageSettings({ customWidth: parseInt(e.target.value) || 210 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Height (mm)</Label>
            <Input
              type="number"
              value={pageSettings.customHeight || 297}
              onChange={(e) =>
                setPageSettings({ customHeight: parseInt(e.target.value) || 297 })
              }
            />
          </div>
        </div>
      )}

      {/* Orientation */}
      <div className="space-y-2">
        <Label>{t('orientation')}</Label>
        <Select
          value={pageSettings.orientation}
          onValueChange={(value) =>
            setPageSettings({ orientation: value as Orientation })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">{t('portrait')}</SelectItem>
            <SelectItem value="landscape">{t('landscape')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Margins */}
      <div className="space-y-2">
        <Label>{t('margins')}</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('marginTop')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={pageSettings.margins.top}
                onChange={(e) =>
                  setPageSettings({
                    margins: { ...pageSettings.margins, top: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">{t('marginUnit')}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('marginBottom')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={pageSettings.margins.bottom}
                onChange={(e) =>
                  setPageSettings({
                    margins: { ...pageSettings.margins, bottom: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">{t('marginUnit')}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('marginLeft')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={pageSettings.margins.left}
                onChange={(e) =>
                  setPageSettings({
                    margins: { ...pageSettings.margins, left: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">{t('marginUnit')}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('marginRight')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={pageSettings.margins.right}
                onChange={(e) =>
                  setPageSettings({
                    margins: { ...pageSettings.margins, right: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">{t('marginUnit')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header & Footer */}
      <div className="space-y-4">
        <Label>{t('headerFooter')}</Label>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">{t('showHeader')}</Label>
          <Switch
            checked={pageSettings.headerFooter.showHeader}
            onCheckedChange={(checked) =>
              setPageSettings({
                headerFooter: { ...pageSettings.headerFooter, showHeader: checked },
              })
            }
          />
        </div>

        {pageSettings.headerFooter.showHeader && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('headerText')}</Label>
            <Input
              value={pageSettings.headerFooter.headerText}
              onChange={(e) =>
                setPageSettings({
                  headerFooter: { ...pageSettings.headerFooter, headerText: e.target.value },
                })
              }
              placeholder={t('headerText')}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">{t('showFooter')}</Label>
          <Switch
            checked={pageSettings.headerFooter.showFooter}
            onCheckedChange={(checked) =>
              setPageSettings({
                headerFooter: { ...pageSettings.headerFooter, showFooter: checked },
              })
            }
          />
        </div>

        {pageSettings.headerFooter.showFooter && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('footerText')}</Label>
            <Input
              value={pageSettings.headerFooter.footerText}
              onChange={(e) =>
                setPageSettings({
                  headerFooter: { ...pageSettings.headerFooter, footerText: e.target.value },
                })
              }
              placeholder={t('footerText')}
            />
          </div>
        )}
      </div>

      {/* Page Numbers */}
      <div className="space-y-4">
        <Label>{t('pageNumbers')}</Label>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">{t('showPageNumbers')}</Label>
          <Switch
            checked={pageSettings.pageNumbers.show}
            onCheckedChange={(checked) =>
              setPageSettings({
                pageNumbers: { ...pageSettings.pageNumbers, show: checked },
              })
            }
          />
        </div>

        {pageSettings.pageNumbers.show && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('pageNumberPosition')}</Label>
            <Select
              value={pageSettings.pageNumbers.position}
              onValueChange={(value) =>
                setPageSettings({
                  pageNumbers: { ...pageSettings.pageNumbers, position: value as PageNumberPosition },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-center">{t('pageNumberPositions.bottomCenter')}</SelectItem>
                <SelectItem value="bottom-right">{t('pageNumberPositions.bottomRight')}</SelectItem>
                <SelectItem value="bottom-left">{t('pageNumberPositions.bottomLeft')}</SelectItem>
                <SelectItem value="top-center">{t('pageNumberPositions.topCenter')}</SelectItem>
                <SelectItem value="top-right">{t('pageNumberPositions.topRight')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className="space-y-4">
        <Label>{t('watermark')}</Label>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">{t('showWatermark')}</Label>
          <Switch
            checked={pageSettings.watermark.show}
            onCheckedChange={(checked) =>
              setPageSettings({
                watermark: { ...pageSettings.watermark, show: checked },
              })
            }
          />
        </div>

        {pageSettings.watermark.show && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('watermarkText')}</Label>
              <Input
                value={pageSettings.watermark.text}
                onChange={(e) =>
                  setPageSettings({
                    watermark: { ...pageSettings.watermark, text: e.target.value },
                  })
                }
                placeholder={t('watermarkText')}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t('watermarkOpacity')}: {Math.round(pageSettings.watermark.opacity * 100)}%
              </Label>
              <Slider
                value={[pageSettings.watermark.opacity * 100]}
                onValueChange={([value]) =>
                  setPageSettings({
                    watermark: { ...pageSettings.watermark, opacity: value / 100 },
                  })
                }
                min={5}
                max={50}
                step={5}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
