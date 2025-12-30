import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirection } from '@/i18n/config';
import { Locale } from '@/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerProvider } from '@/components/ServiceWorkerProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import '@/app/globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme-storage');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    var mode = parsed.state && parsed.state.mode;
                    if (mode === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else if (mode === 'light') {
                      document.documentElement.classList.add('light');
                    } else if (mode === 'system' || !mode) {
                      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.add('light');
                      }
                    }
                  } else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.add('light');
                    }
                  }
                } catch (e) {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <ServiceWorkerProvider>
              <div className="relative flex min-h-screen flex-col">
                {/* Skip link for accessibility */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  Skip to main content
                </a>
                <Header />
                <main id="main-content" className="flex-1" role="main">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </ServiceWorkerProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
