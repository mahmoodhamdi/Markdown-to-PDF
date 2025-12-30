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

const elegantCss = `/* Elegant Theme */
.theme-elegant {
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.8;
  color: #1a1a2e;
  background-color: #fafafa;
  letter-spacing: 0.02em;
}
.theme-elegant h1 { font-size: 2.5em; font-weight: 700; color: #16213e; margin-bottom: 0.5em; }
.theme-elegant h2 { font-size: 1.75em; color: #16213e; border-bottom: 1px solid #ddd; padding-bottom: 0.25em; }
.theme-elegant h3 { font-size: 1.25em; color: #0f3460; font-style: italic; }
.theme-elegant blockquote { font-style: italic; border-left: 3px solid #e94560; padding-left: 1.5em; color: #4a5568; }
.theme-elegant code { font-family: 'Fira Code', Monaco, monospace; background: #f7f7f9; padding: 0.2em 0.4em; border-radius: 3px; }
.theme-elegant pre { background: #f7f7f9; padding: 1.5em; border-radius: 8px; border: 1px solid #eee; }
.theme-elegant a { color: #e94560; text-decoration: none; border-bottom: 1px solid transparent; }
.theme-elegant a:hover { border-bottom-color: #e94560; }`;

const modernCss = `/* Modern Theme */
.theme-modern {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #334155;
  background-color: #ffffff;
}
.theme-modern h1 { font-size: 2.25em; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-top: 1.5em; }
.theme-modern h2 { font-size: 1.5em; font-weight: 700; color: #1e293b; margin-top: 1.5em; padding-top: 0.5em; border-top: 1px solid #e2e8f0; }
.theme-modern h3 { font-size: 1.25em; font-weight: 600; color: #334155; }
.theme-modern p { margin: 1em 0; }
.theme-modern blockquote { margin: 1.5em 0; padding: 1em 1.5em; background: linear-gradient(to right, #dbeafe, #f8fafc); border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; }
.theme-modern code { font-family: 'JetBrains Mono', 'Fira Code', monospace; background: #f1f5f9; color: #6366f1; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
.theme-modern pre { background: #1e293b; color: #e2e8f0; padding: 1.5em; border-radius: 12px; overflow-x: auto; }
.theme-modern pre code { background: transparent; color: inherit; }
.theme-modern table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
.theme-modern th, .theme-modern td { padding: 0.75em; text-align: left; border-bottom: 1px solid #e2e8f0; }
.theme-modern th { background: #f8fafc; font-weight: 600; color: #1e293b; }`;

const newsletterCss = `/* Newsletter Theme */
.theme-newsletter {
  font-family: 'Merriweather', Georgia, serif;
  font-size: 17px;
  line-height: 1.75;
  color: #292929;
  background-color: #ffffff;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
}
.theme-newsletter h1 { font-family: 'Montserrat', 'Helvetica Neue', sans-serif; font-size: 2.5em; font-weight: 900; color: #000; line-height: 1.2; margin-bottom: 0.25em; }
.theme-newsletter h2 { font-family: 'Montserrat', 'Helvetica Neue', sans-serif; font-size: 1.5em; font-weight: 700; color: #333; margin-top: 2em; padding-bottom: 0.25em; border-bottom: 3px solid #000; }
.theme-newsletter h3 { font-family: 'Montserrat', 'Helvetica Neue', sans-serif; font-size: 1.25em; font-weight: 600; color: #444; }
.theme-newsletter p { margin: 1.2em 0; }
.theme-newsletter blockquote { margin: 2em 0; padding: 1em 2em; background: #fafafa; border-left: 4px solid #333; font-style: italic; }
.theme-newsletter img { max-width: 100%; height: auto; border-radius: 4px; margin: 1.5em 0; }
.theme-newsletter a { color: #0066cc; text-decoration: underline; }
.theme-newsletter hr { border: none; border-top: 1px solid #ddd; margin: 2.5em 0; }
.theme-newsletter code { font-family: 'Monaco', 'Consolas', monospace; background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
.theme-newsletter pre { background: #282c34; color: #abb2bf; padding: 1.5em; border-radius: 8px; overflow-x: auto; }`;

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
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated serif design for formal documents',
    css: elegantCss,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean contemporary design with bold typography',
    css: modernCss,
  },
  newsletter: {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Magazine-style layout for blog posts and articles',
    css: newsletterCss,
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
  _codeTheme?: CodeTheme,
  customCss?: string
): string {
  let css = getThemeCss(documentTheme);

  // Add custom CSS if provided
  if (customCss) {
    css += '\n\n/* Custom CSS */\n' + customCss;
  }

  return css;
}
