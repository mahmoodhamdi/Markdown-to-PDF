import { describe, it, expect } from 'vitest';
import {
  pageSizes,
  defaultMargins,
  defaultPageSettings,
  getPageDimensions,
  generatePuppeteerPageSettings,
  generateWatermarkCss,
} from '@/lib/pdf/page-settings';
import { PageSettings } from '@/types';

describe('page-settings', () => {
  describe('pageSizes', () => {
    it('should have correct A4 dimensions', () => {
      expect(pageSizes.a4).toEqual({ width: 210, height: 297 });
    });

    it('should have correct letter dimensions', () => {
      expect(pageSizes.letter).toEqual({ width: 216, height: 279 });
    });

    it('should have correct legal dimensions', () => {
      expect(pageSizes.legal).toEqual({ width: 216, height: 356 });
    });

    it('should have correct A3 dimensions', () => {
      expect(pageSizes.a3).toEqual({ width: 297, height: 420 });
    });

    it('should have custom size defaulting to A4', () => {
      expect(pageSizes.custom).toEqual({ width: 210, height: 297 });
    });
  });

  describe('defaultMargins', () => {
    it('should have 20mm margins on all sides', () => {
      expect(defaultMargins).toEqual({
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      });
    });
  });

  describe('defaultPageSettings', () => {
    it('should have A4 as default page size', () => {
      expect(defaultPageSettings.pageSize).toBe('a4');
    });

    it('should have portrait as default orientation', () => {
      expect(defaultPageSettings.orientation).toBe('portrait');
    });

    it('should have default margins', () => {
      expect(defaultPageSettings.margins).toEqual(defaultMargins);
    });

    it('should have header and footer disabled by default', () => {
      expect(defaultPageSettings.headerFooter.showHeader).toBe(false);
      expect(defaultPageSettings.headerFooter.showFooter).toBe(false);
    });

    it('should have page numbers enabled by default', () => {
      expect(defaultPageSettings.pageNumbers.show).toBe(true);
      expect(defaultPageSettings.pageNumbers.position).toBe('bottom-center');
    });

    it('should have watermark disabled by default', () => {
      expect(defaultPageSettings.watermark.show).toBe(false);
      expect(defaultPageSettings.watermark.opacity).toBe(0.1);
    });
  });

  describe('getPageDimensions', () => {
    it('should return A4 dimensions in portrait', () => {
      const result = getPageDimensions('a4', 'portrait');
      expect(result).toEqual({ width: 210, height: 297 });
    });

    it('should return A4 dimensions swapped in landscape', () => {
      const result = getPageDimensions('a4', 'landscape');
      expect(result).toEqual({ width: 297, height: 210 });
    });

    it('should return letter dimensions in portrait', () => {
      const result = getPageDimensions('letter', 'portrait');
      expect(result).toEqual({ width: 216, height: 279 });
    });

    it('should return letter dimensions swapped in landscape', () => {
      const result = getPageDimensions('letter', 'landscape');
      expect(result).toEqual({ width: 279, height: 216 });
    });

    it('should use custom dimensions when pageSize is custom', () => {
      const result = getPageDimensions('custom', 'portrait', 100, 200);
      expect(result).toEqual({ width: 100, height: 200 });
    });

    it('should swap custom dimensions in landscape', () => {
      const result = getPageDimensions('custom', 'landscape', 100, 200);
      expect(result).toEqual({ width: 200, height: 100 });
    });

    it('should fall back to A4 if custom dimensions not provided', () => {
      const result = getPageDimensions('custom', 'portrait');
      expect(result).toEqual({ width: 210, height: 297 });
    });
  });

  describe('generatePuppeteerPageSettings', () => {
    it('should generate settings with correct format for A4', () => {
      const result = generatePuppeteerPageSettings(defaultPageSettings);
      expect(result.format).toBe('a4');
      expect(result.landscape).toBe(false);
    });

    it('should generate settings with landscape true for landscape orientation', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        orientation: 'landscape',
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.landscape).toBe(true);
    });

    it('should convert margins to mm strings', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        margins: { top: 10, bottom: 15, left: 20, right: 25 },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.margin).toEqual({
        top: '10mm',
        bottom: '15mm',
        left: '20mm',
        right: '25mm',
      });
    });

    it('should use width and height for custom page size', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        pageSize: 'custom',
        customWidth: 150,
        customHeight: 250,
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.width).toBe('150mm');
      expect(result.height).toBe('250mm');
      expect(result.format).toBeUndefined();
    });

    it('should enable displayHeaderFooter when header is shown', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        headerFooter: {
          showHeader: true,
          showFooter: false,
          headerText: 'Test Header',
          footerText: '',
        },
        pageNumbers: { show: false, position: 'bottom-center' },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.displayHeaderFooter).toBe(true);
    });

    it('should enable displayHeaderFooter when footer is shown', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        headerFooter: {
          showHeader: false,
          showFooter: true,
          headerText: '',
          footerText: 'Test Footer',
        },
        pageNumbers: { show: false, position: 'bottom-center' },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.displayHeaderFooter).toBe(true);
    });

    it('should enable displayHeaderFooter when page numbers are shown', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        headerFooter: {
          showHeader: false,
          showFooter: false,
          headerText: '',
          footerText: '',
        },
        pageNumbers: { show: true, position: 'bottom-center' },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.displayHeaderFooter).toBe(true);
    });

    it('should include header text in header template', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        headerFooter: {
          showHeader: true,
          showFooter: false,
          headerText: 'My Document',
          footerText: '',
        },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.headerTemplate).toContain('My Document');
    });

    it('should include footer text in footer template', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        headerFooter: {
          showHeader: false,
          showFooter: true,
          headerText: '',
          footerText: 'Page Footer',
        },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.footerTemplate).toContain('Page Footer');
    });

    it('should include page numbers in footer template', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        pageNumbers: { show: true, position: 'bottom-center' },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.footerTemplate).toContain('pageNumber');
      expect(result.footerTemplate).toContain('totalPages');
    });

    it('should place page numbers in header for top positions', () => {
      const settings: PageSettings = {
        ...defaultPageSettings,
        pageNumbers: { show: true, position: 'top-center' },
      };
      const result = generatePuppeteerPageSettings(settings);
      expect(result.headerTemplate).toContain('pageNumber');
    });

    it('should map all standard page sizes correctly', () => {
      const sizes: Array<'a4' | 'letter' | 'legal' | 'a3'> = ['a4', 'letter', 'legal', 'a3'];
      sizes.forEach((size) => {
        const settings: PageSettings = {
          ...defaultPageSettings,
          pageSize: size,
        };
        const result = generatePuppeteerPageSettings(settings);
        expect(result.format).toBe(size);
      });
    });
  });

  describe('generateWatermarkCss', () => {
    it('should return empty string when watermark is disabled', () => {
      const result = generateWatermarkCss({
        show: false,
        text: 'Test',
        opacity: 0.1,
      });
      expect(result).toBe('');
    });

    it('should return empty string when watermark text is empty', () => {
      const result = generateWatermarkCss({
        show: true,
        text: '',
        opacity: 0.1,
      });
      expect(result).toBe('');
    });

    it('should generate CSS with watermark text', () => {
      const result = generateWatermarkCss({
        show: true,
        text: 'CONFIDENTIAL',
        opacity: 0.1,
      });
      expect(result).toContain('CONFIDENTIAL');
      expect(result).toContain('body::before');
    });

    it('should include correct opacity value', () => {
      const result = generateWatermarkCss({
        show: true,
        text: 'DRAFT',
        opacity: 0.25,
      });
      expect(result).toContain('0.25');
    });

    it('should include rotation transform', () => {
      const result = generateWatermarkCss({
        show: true,
        text: 'SAMPLE',
        opacity: 0.1,
      });
      expect(result).toContain('rotate(-45deg)');
    });

    it('should position watermark in center', () => {
      const result = generateWatermarkCss({
        show: true,
        text: 'TEST',
        opacity: 0.1,
      });
      expect(result).toContain('top: 50%');
      expect(result).toContain('left: 50%');
      expect(result).toContain('translate(-50%, -50%)');
    });

    it('should set high z-index for watermark', () => {
      const result = generateWatermarkCss({
        show: true,
        text: 'TEST',
        opacity: 0.1,
      });
      expect(result).toContain('z-index: 9999');
    });

    it('should sanitize potentially dangerous characters', () => {
      const result = generateWatermarkCss({
        show: true,
        text: "Test'; background: red;",
        opacity: 0.1,
      });
      // The text should have escaped quotes
      expect(result).toContain("\\'");
      // The content should be preserved (escaped)
      expect(result).toContain("Test");
    });
  });
});
