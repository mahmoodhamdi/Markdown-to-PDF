'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { DataExport } from '@/components/account/DataExport';
import { DeleteAccount } from '@/components/account/DeleteAccount';
import { Settings } from 'lucide-react';

export default function AccountPage() {
  const { status } = useSession();
  const t = useTranslations('account');

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  if (status === 'loading') {
    return <AccountSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {/* Data Export Section */}
      <DataExport />

      {/* Delete Account Section */}
      <DeleteAccount />
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72 mt-1" />
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
