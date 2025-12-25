import { describe, it, expect } from 'vitest';
import {
  getPrintStyles,
  getPrintPageSettings,
  createPrintDocument,
} from '@/lib/print/styles';

describe('Print Styles', () => {
  describe('getPrintStyles', () => {
    it('should return valid CSS string', () => {
      const styles = getPrintStyles();
      expect(typeof styles).toBe('string');
      expect(styles.length).toBeGreaterThan(0);
    });

    it('should include print color adjust rules', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('-webkit-print-color-adjust: exact');
      expect(styles).toContain('print-color-adjust: exact');
    });

    it('should include page break rules', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('page-break-after: avoid');
      expect(styles).toContain('page-break-inside: avoid');
    });

    it('should include orphans and widows rules', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('orphans: 3');
      expect(styles).toContain('widows: 3');
    });

    it('should include heading styles', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('h1 {');
      expect(styles).toContain('h2 {');
      expect(styles).toContain('h3 {');
    });

    it('should include code block styles', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('pre, code');
      expect(styles).toContain('font-family');
      expect(styles).toContain('monospace');
    });

    it('should include table styles', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('table {');
      expect(styles).toContain('border-collapse: collapse');
      expect(styles).toContain('th, td');
    });

    it('should include image styles', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('img {');
      expect(styles).toContain('max-width: 100%');
    });

    it('should include blockquote styles', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('blockquote {');
      expect(styles).toContain('border-left');
    });

    it('should include list styles', () => {
      const styles = getPrintStyles();
      expect(styles).toContain('ul, ol');
      expect(styles).toContain('li {');
    });
  });

  describe('getPrintPageSettings', () => {
    it('should return default page margins', () => {
      const settings = getPrintPageSettings();
      expect(settings).toContain('@page');
      expect(settings).toContain('margin-top: 1in');
      expect(settings).toContain('margin-bottom: 1in');
      expect(settings).toContain('margin-left: 1in');
      expect(settings).toContain('margin-right: 1in');
    });

    it('should accept custom margins', () => {
      const settings = getPrintPageSettings({
        marginTop: '0.5in',
        marginBottom: '0.5in',
        marginLeft: '0.75in',
        marginRight: '0.75in',
      });
      expect(settings).toContain('margin-top: 0.5in');
      expect(settings).toContain('margin-bottom: 0.5in');
      expect(settings).toContain('margin-left: 0.75in');
      expect(settings).toContain('margin-right: 0.75in');
    });

    it('should use defaults for missing options', () => {
      const settings = getPrintPageSettings({
        marginTop: '2in',
      });
      expect(settings).toContain('margin-top: 2in');
      expect(settings).toContain('margin-bottom: 1in');
      expect(settings).toContain('margin-left: 1in');
      expect(settings).toContain('margin-right: 1in');
    });
  });

  describe('createPrintDocument', () => {
    it('should create valid HTML document', () => {
      const content = '<h1>Test</h1><p>Hello World</p>';
      const doc = createPrintDocument(content);

      expect(doc).toContain('<!DOCTYPE html>');
      expect(doc).toContain('<html>');
      expect(doc).toContain('</html>');
      expect(doc).toContain('<head>');
      expect(doc).toContain('</head>');
      expect(doc).toContain('<body>');
      expect(doc).toContain('</body>');
    });

    it('should include content in body', () => {
      const content = '<h1>Test Title</h1><p>Test paragraph</p>';
      const doc = createPrintDocument(content);

      expect(doc).toContain('<h1>Test Title</h1>');
      expect(doc).toContain('<p>Test paragraph</p>');
    });

    it('should use default title', () => {
      const doc = createPrintDocument('<p>Test</p>');
      expect(doc).toContain('<title>Document</title>');
    });

    it('should use custom title', () => {
      const doc = createPrintDocument('<p>Test</p>', 'My Custom Title');
      expect(doc).toContain('<title>My Custom Title</title>');
    });

    it('should include print styles', () => {
      const doc = createPrintDocument('<p>Test</p>');
      expect(doc).toContain('<style>');
      expect(doc).toContain('print-color-adjust');
    });

    it('should include page settings', () => {
      const doc = createPrintDocument('<p>Test</p>');
      expect(doc).toContain('@page');
    });

    it('should include additional styles when provided', () => {
      const additionalStyles = '.custom-class { color: red; }';
      const doc = createPrintDocument('<p>Test</p>', 'Title', additionalStyles);
      expect(doc).toContain('.custom-class { color: red; }');
    });

    it('should include meta charset', () => {
      const doc = createPrintDocument('<p>Test</p>');
      expect(doc).toContain('<meta charset="utf-8">');
    });
  });
});
