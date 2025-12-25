'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  FolderOpen,
  LineChart,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  dividerAfter?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/dashboard/usage', labelKey: 'usage', icon: BarChart3 },
  { href: '/dashboard/subscription', labelKey: 'subscription', icon: CreditCard },
  { href: '/dashboard/files', labelKey: 'files', icon: FolderOpen },
  { href: '/dashboard/analytics', labelKey: 'analytics', icon: LineChart, dividerAfter: true },
  { href: '/settings', labelKey: 'settings', icon: Settings },
];

export function DashboardSidebar() {
  const t = useTranslations('dashboard.nav');
  const pathname = usePathname();

  // Remove locale prefix for comparison
  const currentPath = pathname.replace(/^\/(en|ar)/, '');

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(href);
  };

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <nav className="sticky top-20 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
              {item.dividerAfter && (
                <div className="my-3 border-t" />
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
