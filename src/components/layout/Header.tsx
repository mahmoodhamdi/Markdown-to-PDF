'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tPricing = useTranslations('pricing');

  const navItems = [
    { href: '/', label: t('home') },
    { href: '/templates', label: t('templates') },
    { href: '/themes', label: t('themes') },
    { href: '/batch', label: t('batch') },
    { href: '/pricing', label: tPricing('title') },
    { href: '/api-docs', label: t('apiDocs') },
    { href: '/settings', label: t('settings') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 me-6">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold hidden sm:inline-block">{tCommon('appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-6 text-sm font-medium flex-1"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center ms-auto space-x-2">
          <UserMenu />
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-navigation"
        className={cn(
          'md:hidden border-t bg-background overflow-hidden transition-all duration-200',
          mobileMenuOpen ? 'max-h-64' : 'max-h-0'
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="container py-4 space-y-2" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 px-4 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
