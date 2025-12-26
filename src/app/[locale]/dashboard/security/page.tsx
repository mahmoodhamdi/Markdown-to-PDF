'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { PasswordChange } from '@/components/security/PasswordChange';
import { SessionList } from '@/components/security/SessionList';
import { ConnectedAccounts } from '@/components/security/ConnectedAccounts';
import { Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  hasPassword: boolean;
  createdAt: string;
}

export default function SecurityPage() {
  const { status } = useSession();
  const t = useTranslations('security');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/profile');
      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.user);
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, fetchProfile]);

  if (status === 'loading' || loading) {
    return <SecuritySkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {/* Password Change Section */}
      <PasswordChange hasPassword={profile.hasPassword} />

      {/* Active Sessions Section */}
      <SessionList />

      {/* Connected Accounts Section */}
      <ConnectedAccounts hasPassword={profile.hasPassword} />
    </div>
  );
}

function SecuritySkeleton() {
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
