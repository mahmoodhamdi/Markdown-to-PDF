'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle className="h-24 w-24 text-destructive mb-6" />

      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>

      <p className="text-xl text-muted-foreground mb-2">
        An unexpected error occurred. Please try again.
      </p>

      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono mb-8">
          Error ID: {error.digest}
        </p>
      )}

      {!error.digest && <div className="mb-8" />}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>

        <Link href="/">
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
