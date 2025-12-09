import { describe, it, expect } from 'vitest';
import {
  themes,
  codeThemes,
  getThemeCss,
  getThemeInfo,
  getAllThemes,
  getCodeThemeStylesheet,
  generateFullCss,
} from '@/lib/themes/manager';

describe('Theme Manager', () => {
  describe('themes', () => {
    it('should have all built-in themes', () => {
      expect(themes).toHaveProperty('github');
      expect(themes).toHaveProperty('academic');
      expect(themes).toHaveProperty('minimal');
      expect(themes).toHaveProperty('dark');
      expect(themes).toHaveProperty('professional');
    });

    it('each theme should have required properties', () => {
      Object.values(themes).forEach((theme) => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('description');
        expect(theme).toHaveProperty('css');
      });
    });
  });

  describe('codeThemes', () => {
    it('should have all code themes', () => {
      expect(codeThemes).toHaveProperty('github-dark');
      expect(codeThemes).toHaveProperty('github-light');
      expect(codeThemes).toHaveProperty('monokai');
      expect(codeThemes).toHaveProperty('dracula');
      expect(codeThemes).toHaveProperty('nord');
      expect(codeThemes).toHaveProperty('one-dark');
      expect(codeThemes).toHaveProperty('vs-code');
    });
  });

  describe('getThemeCss', () => {
    it('should return CSS for valid theme', () => {
      const css = getThemeCss('github');
      expect(css).toBeTruthy();
      expect(css).toContain('.theme-github');
    });

    it('should return github CSS for invalid theme', () => {
      const css = getThemeCss('invalid' as never);
      expect(css).toContain('.theme-github');
    });
  });

  describe('getThemeInfo', () => {
    it('should return theme info for valid theme', () => {
      const info = getThemeInfo('academic');
      expect(info.id).toBe('academic');
      expect(info.name).toBe('Academic');
    });

    it('should return github info for invalid theme', () => {
      const info = getThemeInfo('invalid' as never);
      expect(info.id).toBe('github');
    });
  });

  describe('getAllThemes', () => {
    it('should return array of all themes', () => {
      const all = getAllThemes();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(5);
    });
  });

  describe('getCodeThemeStylesheet', () => {
    it('should return CDN URL for code theme', () => {
      const url = getCodeThemeStylesheet('monokai');
      expect(url).toContain('cdnjs.cloudflare.com');
      expect(url).toContain('highlight.js');
      expect(url).toContain('monokai');
    });

    it('should return github as default', () => {
      const url = getCodeThemeStylesheet('invalid' as never);
      expect(url).toContain('github');
    });
  });

  describe('generateFullCss', () => {
    it('should generate CSS with theme', () => {
      const css = generateFullCss('github');
      expect(css).toContain('.theme-github');
    });

    it('should include custom CSS', () => {
      const customCss = '.custom { color: red; }';
      const css = generateFullCss('github', undefined, customCss);
      expect(css).toContain('.theme-github');
      expect(css).toContain('.custom');
    });
  });
});
