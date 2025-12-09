export type Locale = 'en' | 'ar';

export type ThemeMode = 'light' | 'dark' | 'system';

export type DocumentTheme = 'github' | 'academic' | 'minimal' | 'dark' | 'professional';

export type CodeTheme =
  | 'github-dark'
  | 'github-light'
  | 'monokai'
  | 'dracula'
  | 'nord'
  | 'one-dark'
  | 'vs-code';

export type PageSize = 'a4' | 'letter' | 'legal' | 'a3' | 'custom';

export type Orientation = 'portrait' | 'landscape';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right';

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface HeaderFooter {
  showHeader: boolean;
  showFooter: boolean;
  headerText: string;
  footerText: string;
}

export interface Watermark {
  show: boolean;
  text: string;
  opacity: number;
}

export interface PageNumbers {
  show: boolean;
  position: PageNumberPosition;
}

export interface PageSettings {
  pageSize: PageSize;
  customWidth?: number;
  customHeight?: number;
  orientation: Orientation;
  margins: PageMargins;
  headerFooter: HeaderFooter;
  pageNumbers: PageNumbers;
  watermark: Watermark;
}

export interface ConversionOptions {
  markdown: string;
  theme?: DocumentTheme;
  codeTheme?: CodeTheme;
  pageSettings?: Partial<PageSettings>;
  customCss?: string;
}

export interface ConversionResult {
  success: boolean;
  data?: Buffer | string;
  error?: string;
  pages?: number;
  fileSize?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'academic' | 'personal' | 'technical';
  content: string;
}

export interface BatchFile {
  id: string;
  name: string;
  content: string;
  size: number;
  status: 'pending' | 'converting' | 'success' | 'failed';
  error?: string;
  result?: Blob;
}

export interface EditorStats {
  words: number;
  characters: number;
  lines: number;
  readingTime: number;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}
