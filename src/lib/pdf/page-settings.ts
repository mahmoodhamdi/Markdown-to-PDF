import { PageSettings, PageSize, Orientation, PageMargins } from '@/types';
import type { PaperFormat } from 'puppeteer';

export const pageSizes: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
  legal: { width: 216, height: 356 },
  a3: { width: 297, height: 420 },
  custom: { width: 210, height: 297 },
};

export const defaultMargins: PageMargins = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20,
};

export const defaultPageSettings: PageSettings = {
  pageSize: 'a4',
  orientation: 'portrait',
  margins: defaultMargins,
  headerFooter: {
    showHeader: false,
    showFooter: false,
    headerText: '',
    footerText: '',
  },
  pageNumbers: {
    show: true,
    position: 'bottom-center',
  },
  watermark: {
    show: false,
    text: '',
    opacity: 0.1,
  },
};

export function getPageDimensions(
  pageSize: PageSize,
  orientation: Orientation,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  let { width, height } = pageSizes[pageSize];

  if (pageSize === 'custom' && customWidth && customHeight) {
    width = customWidth;
    height = customHeight;
  }

  // Swap dimensions for landscape
  if (orientation === 'landscape') {
    return { width: height, height: width };
  }

  return { width, height };
}

export function generatePuppeteerPageSettings(settings: PageSettings): {
  format?: PaperFormat;
  width?: string;
  height?: string;
  landscape: boolean;
  margin: { top: string; bottom: string; left: string; right: string };
  displayHeaderFooter: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
} {
  const { width, height } = getPageDimensions(
    settings.pageSize,
    settings.orientation,
    settings.customWidth,
    settings.customHeight
  );

  const result: ReturnType<typeof generatePuppeteerPageSettings> = {
    landscape: settings.orientation === 'landscape',
    margin: {
      top: `${settings.margins.top}mm`,
      bottom: `${settings.margins.bottom}mm`,
      left: `${settings.margins.left}mm`,
      right: `${settings.margins.right}mm`,
    },
    displayHeaderFooter:
      settings.headerFooter.showHeader ||
      settings.headerFooter.showFooter ||
      settings.pageNumbers.show,
  };

  // Use format for standard sizes, width/height for custom
  if (settings.pageSize === 'custom') {
    result.width = `${width}mm`;
    result.height = `${height}mm`;
  } else {
    // Map page sizes to Puppeteer PaperFormat
    const formatMap: Record<string, PaperFormat> = {
      a4: 'a4',
      letter: 'letter',
      legal: 'legal',
      a3: 'a3',
    };
    result.format = formatMap[settings.pageSize] || 'a4';
  }

  // Generate header template
  if (settings.headerFooter.showHeader) {
    result.headerTemplate = `
      <div style="width: 100%; font-size: 10px; padding: 5px 20px; text-align: center; color: #666;">
        ${settings.headerFooter.headerText}
      </div>
    `;
  } else {
    result.headerTemplate = '<div></div>';
  }

  // Generate footer template
  const footerParts: string[] = [];

  if (settings.headerFooter.showFooter && settings.headerFooter.footerText) {
    footerParts.push(settings.headerFooter.footerText);
  }

  if (settings.pageNumbers.show) {
    const pageNumberHtml = '<span class="pageNumber"></span> / <span class="totalPages"></span>';

    let alignment = 'center';
    if (settings.pageNumbers.position.includes('left')) {
      alignment = 'left';
    } else if (settings.pageNumbers.position.includes('right')) {
      alignment = 'right';
    }

    if (settings.pageNumbers.position.startsWith('top')) {
      // Add to header instead
      result.headerTemplate = `
        <div style="width: 100%; font-size: 10px; padding: 5px 20px; display: flex; justify-content: ${alignment === 'center' ? 'center' : alignment === 'left' ? 'flex-start' : 'flex-end'}; color: #666;">
          ${settings.headerFooter.showHeader ? settings.headerFooter.headerText : ''}
          <span style="margin-left: auto;">${pageNumberHtml}</span>
        </div>
      `;
    } else {
      footerParts.push(pageNumberHtml);
    }
  }

  result.footerTemplate = `
    <div style="width: 100%; font-size: 10px; padding: 5px 20px; text-align: center; color: #666;">
      ${footerParts.join(' - ')}
    </div>
  `;

  return result;
}

export function generateWatermarkCss(watermark: PageSettings['watermark']): string {
  if (!watermark.show || !watermark.text) {
    return '';
  }

  return `
    @page {
      @bottom-center {
        content: '';
      }
    }

    body::before {
      content: '${watermark.text}';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72px;
      color: rgba(0, 0, 0, ${watermark.opacity});
      z-index: 9999;
      pointer-events: none;
      white-space: nowrap;
    }
  `;
}
