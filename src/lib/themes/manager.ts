import { DocumentTheme, CodeTheme } from '@/types';

export interface ThemeInfo {
  id: DocumentTheme;
  name: string;
  description: string;
  css: string;
}

// Theme CSS (embedded directly to avoid import issues)
const githubCss = `/* GitHub Theme */
.theme-github {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #24292e;
  background-color: #ffffff;
}
.theme-github h1, .theme-github h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.theme-github h1 { font-size: 2em; }
.theme-github h2 { font-size: 1.5em; }
.theme-github code { background-color: rgba(27, 31, 35, 0.05); padding: 0.2em 0.4em; border-radius: 6px; }
.theme-github pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; }
.theme-github blockquote { border-left: 0.25em solid #dfe2e5; padding: 0 1em; color: #6a737d; }`;

const academicCss = `/* Academic Theme */
.theme-academic {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 2;
  color: #000000;
  background-color: #ffffff;
  text-align: justify;
}
.theme-academic h1 { font-size: 18pt; text-align: center; }
.theme-academic h2 { font-size: 14pt; }
.theme-academic p { text-indent: 0.5in; }`;

const minimalCss = `/* Minimal Theme */
.theme-minimal {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #333333;
  background-color: #ffffff;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}`;

const darkCss = `/* Dark Theme */
.theme-dark {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: #e4e4e7;
  background-color: #18181b;
}
.theme-dark h1, .theme-dark h2 { border-bottom: 1px solid #3f3f46; }
.theme-dark code { background-color: #27272a; color: #f472b6; }
.theme-dark pre { background-color: #27272a; border: 1px solid #3f3f46; }`;

const professionalCss = `/* Professional Theme */
.theme-professional {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #2c3e50;
  background-color: #ffffff;
}
.theme-professional h1 { border-bottom: 2px solid #2b6cb0; color: #1a365d; }
.theme-professional h2 { border-bottom: 1px solid #bee3f8; color: #2c5282; }`;

export const themes: Record<DocumentTheme, ThemeInfo> = {
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Clean and familiar GitHub markdown style',
    css: githubCss,
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Formal thesis and research paper style',
    css: academicCss,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and distraction-free',
    css: minimalCss,
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Dark mode friendly theme',
    css: darkCss,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Business and corporate documents',
    css: professionalCss,
  },
};

export const codeThemes: Record<CodeTheme, string> = {
  'github-dark': 'github-dark',
  'github-light': 'github',
  monokai: 'monokai',
  dracula: 'dracula',
  nord: 'nord',
  'one-dark': 'atom-one-dark',
  'vs-code': 'vs2015',
};

export function getThemeCss(theme: DocumentTheme): string {
  return themes[theme]?.css || themes.github.css;
}

export function getThemeInfo(theme: DocumentTheme): ThemeInfo {
  return themes[theme] || themes.github;
}

export function getAllThemes(): ThemeInfo[] {
  return Object.values(themes);
}

export function getCodeThemeStylesheet(codeTheme: CodeTheme): string {
  const themeName = codeThemes[codeTheme] || 'github';
  return `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeName}.min.css`;
}

export function generateFullCss(
  documentTheme: DocumentTheme,
  codeTheme?: CodeTheme,
  customCss?: string
): string {
  let css = getThemeCss(documentTheme);

  // Add custom CSS if provided
  if (customCss) {
    css += '\n\n/* Custom CSS */\n' + customCss;
  }

  return css;
}
