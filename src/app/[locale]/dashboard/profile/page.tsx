'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileForm } from '@/components/profile/ProfileForm';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  image: string;
  plan: string;
  hasPassword: boolean;
  emailVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const t = useTranslations('profile');

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

  const handleProfileUpdate = async (updates: { name?: string; image?: string }) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.user);
        // Update session to reflect changes
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            image: data.user.image,
          },
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const handleAvatarUpdate = async (imageUrl: string) => {
    return handleProfileUpdate({ image: imageUrl });
  };

  if (status === 'loading' || loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
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
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Profile Header */}
      <ProfileHeader
        name={profile.name}
        email={profile.email}
        image={profile.image}
        plan={profile.plan}
        emailVerified={profile.emailVerified}
        createdAt={profile.createdAt}
        onAvatarChange={handleAvatarUpdate}
      />

      {/* Profile Form */}
      <ProfileForm
        name={profile.name}
        email={profile.email}
        hasPassword={profile.hasPassword}
        emailVerified={profile.emailVerified}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
