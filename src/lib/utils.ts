import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EditorStats } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateEditorStats(text: string): EditorStats {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {
      words: 0,
      characters: 0,
      lines: 0,
      readingTime: 0,
    };
  }

  const words = trimmedText.split(/\s+/).filter((word) => word.length > 0).length;

  const characters = trimmedText.length;
  const lines = text.split('\n').length;
  const readingTime = Math.ceil(words / 200); // Average reading speed

  return {
    words,
    characters,
    lines,
    readingTime,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function estimatePages(text: string): number {
  const words = text.split(/\s+/).filter((word) => word.length > 0).length;
  const wordsPerPage = 300; // Approximate words per A4 page
  return Math.max(1, Math.ceil(words / wordsPerPage));
}
