'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations('auth');

  if (status === 'loading') {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          {t('login')}
        </Button>
      </Link>
    );
  }

  const planColors = {
    free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    team: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {session.user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{session.user?.name}</p>
            <p className="text-xs text-muted-foreground">{session.user?.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  planColors[session.user?.plan || 'free']
                )}
              >
                {t(session.user?.plan || 'free')}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('usage')}
        </DropdownMenuLabel>
        <div className="px-2 py-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('conversionsToday')}</span>
            <span>{session.user?.usage?.conversions || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('apiCallsToday')}</span>
            <span>{session.user?.usage?.apiCalls || 0}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <Link href="/settings">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            {t('myAccount')}
          </DropdownMenuItem>
        </Link>
        <Link href="/pricing">
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            {t('upgrade')}
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
