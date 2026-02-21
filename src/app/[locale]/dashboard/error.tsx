'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { AlertCircle, LayoutDashboard, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <AlertCircle className="h-20 w-20 text-destructive mb-6" />

      <h2 className="text-3xl font-bold mb-3">Something went wrong</h2>

      <p className="text-lg text-muted-foreground mb-2 max-w-md">
        An error occurred while loading the dashboard. Your data is safe.
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

        <Link href="/dashboard">
          <Button variant="outline">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
