'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2, FileText, FileCode, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEditorStore } from '@/stores/editor-store';
import { useThemeStore } from '@/stores/theme-store';
import { useSettingsStore } from '@/stores/settings-store';

type ExportFormat = 'pdf' | 'html';

export function ConvertButton() {
  const t = useTranslations('converter');
  const tErrors = useTranslations('errors');
  const [isConverting, setIsConverting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const { content } = useEditorStore();
  const { documentTheme, codeTheme, customCss } = useThemeStore();
  const { pageSettings } = useSettingsStore();

  const handleConvert = async () => {
    if (!content.trim()) {
      toast.error(tErrors('emptyContent'));
      return;
    }

    setIsConverting(true);

    try {
      if (format === 'pdf') {
        const response = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            markdown: content,
            theme: documentTheme,
            codeTheme,
            customCss,
            pageSettings,
          }),
        });

        if (response.status === 429) {
          toast.error(tErrors('tooManyRequests'));
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Conversion failed');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(t('conversionSuccess'));
      } else {
        // HTML export
        const response = await fetch('/api/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            markdown: content,
            theme: documentTheme,
          }),
        });

        if (response.status === 429) {
          toast.error(tErrors('tooManyRequests'));
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Preview generation failed');
        }

        const { html } = await response.json();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(t('conversionSuccess'));
      }
    } catch (error) {
      console.error('Conversion error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error(tErrors('networkError'));
      } else {
        toast.error(t('conversionFailed'));
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handlePrint = async () => {
    if (!content.trim()) {
      toast.error(tErrors('emptyContent'));
      return;
    }

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: content,
          theme: documentTheme,
        }),
      });

      if (!response.ok) {
        toast.error(t('conversionFailed'));
        return;
      }

      const { html } = await response.json();

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error(tErrors('generic'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </div>
          </SelectItem>
          <SelectItem value="html">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              HTML
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={handleConvert}
        disabled={isConverting || !content.trim()}
        data-testid="convert-btn"
      >
        {isConverting ? (
          <>
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
            {t('converting')}
          </>
        ) : (
          <>
            <Download className="h-4 w-4 me-2" />
            {format === 'pdf' ? t('downloadPdf') : t('downloadHtml')}
          </>
        )}
      </Button>

      <Button
        variant="outline"
        onClick={handlePrint}
        disabled={!content.trim()}
        data-testid="print-btn"
      >
        <Printer className="h-4 w-4 me-2" />
        {t('print')}
      </Button>
    </div>
  );
}
