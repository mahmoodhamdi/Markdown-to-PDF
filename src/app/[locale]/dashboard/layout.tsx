'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSidebar } from '@/components/dashboard';
import { DashboardMobileNav } from '@/components/dashboard/DashboardMobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const t = useTranslations('dashboard');

  return (
    <div className="container py-8">
      {/* Mobile header - only visible on small screens */}
      <div className="flex items-center justify-between mb-6 md:hidden">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-semibold text-base">{t('title')}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile slide-in nav drawer */}
      {mobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl md:hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t('title')}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2">
              <DashboardMobileNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar - hidden on mobile */}
        <DashboardSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
