'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
      <FileQuestion className="h-24 w-24 text-muted-foreground mb-6" />
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">{t('noResults')}</p>
      <Link href="/">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
      </Link>
    </div>
  );
}
