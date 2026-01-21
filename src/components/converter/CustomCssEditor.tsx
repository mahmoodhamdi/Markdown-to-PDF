'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme-store';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomCssEditorProps {
  className?: string;
}

export function CustomCssEditor({ className }: CustomCssEditorProps) {
  const t = useTranslations('customCss');
  const { data: session } = useSession();
  const { customCss, setCustomCss } = useThemeStore();

  // Check if user has pro plan or higher
  const userPlan = session?.user?.plan || 'free';
  const hasCustomCssAccess = ['pro', 'team', 'enterprise'].includes(userPlan);

  if (!hasCustomCssAccess) {
    return (
      <div className={cn('space-y-4', className)}>
        <Label className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {t('title')}
          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
            Pro
          </span>
        </Label>
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex flex-col items-center justify-center text-center py-4 gap-3">
            <Sparkles className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium text-sm">{t('upgradeTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('upgradeDescription')}</p>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                {t('upgradeButton')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="custom-css">{t('title')}</Label>
        <span className="text-xs text-muted-foreground">{t('optional')}</span>
      </div>
      <Textarea
        id="custom-css"
        value={customCss}
        onChange={(e) => setCustomCss(e.target.value)}
        placeholder={t('placeholder')}
        className="font-mono text-sm min-h-[150px]"
      />
      <p className="text-xs text-muted-foreground">{t('hint')}</p>
    </div>
  );
}
