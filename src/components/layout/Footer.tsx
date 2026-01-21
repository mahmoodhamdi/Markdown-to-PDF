'use client';

import { useTranslations } from 'next-intl';
import { Heart, Github } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t('copyright', { year: currentYear })}</p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/mahmoodhamdi/Markdown-to-PDF"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">{t('github')}</span>
            </a>

            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {t('madeWith')} <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
