'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { LayoutDashboard, Users, BarChart3, Webhook, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/admin', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'users', icon: Users },
  { href: '/admin/analytics', labelKey: 'analytics', icon: BarChart3 },
  { href: '/admin/webhooks', labelKey: 'webhooks', icon: Webhook },
];

function AdminSidebar() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();

  const currentPath = pathname.replace(/^\/(en|ar)/, '');

  const isActive = (href: string) => {
    if (href === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(href);
  };

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="mb-4 px-4 py-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Shield className="h-4 w-4" />
        {t('adminPanel')}
      </div>
      <nav className="sticky top-20 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
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
          );
        })}
      </nav>
    </aside>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8">
      <div className="flex gap-8">
        <AdminSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

function AdminLayoutSkeleton() {
  return (
    <div className="container py-8">
      <div className="flex gap-8">
        <aside className="w-64 shrink-0 hidden md:block space-y-2">
          <Skeleton className="h-6 w-32 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-4">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <AdminLayoutSkeleton />;
  }

  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  // Role check: only allow admins
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'admin') {
    redirect('/dashboard');
  }

  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
