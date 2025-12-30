'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from './AvatarUpload';
import { Mail, Calendar, Shield, CheckCircle, AlertCircle, FileText, FolderOpen, TrendingUp } from 'lucide-react';

interface QuickStats {
  totalConversions: number;
  totalFiles: number;
  thisMonthConversions: number;
}

interface ProfileHeaderProps {
  name: string;
  email: string;
  image: string;
  plan: string;
  emailVerified: boolean | null;
  createdAt: string;
  onAvatarChange: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
  stats?: QuickStats;
  statsLoading?: boolean;
}

export function ProfileHeader({
  name,
  email,
  image,
  plan,
  emailVerified,
  createdAt,
  onAvatarChange,
  stats,
  statsLoading,
}: ProfileHeaderProps) {
  const t = useTranslations('profile');
  const [avatarUrl, setAvatarUrl] = useState(image);
  const [updating, setUpdating] = useState(false);

  const handleAvatarChange = async (newUrl: string) => {
    setUpdating(true);
    try {
      const result = await onAvatarChange(newUrl);
      if (result.success) {
        setAvatarUrl(newUrl);
      }
      return result;
    } finally {
      setUpdating(false);
    }
  };

  const memberSince = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'default';
      case 'team':
        return 'default';
      case 'pro':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <AvatarUpload
            currentImage={avatarUrl}
            name={name || email}
            onImageChange={handleAvatarChange}
            disabled={updating}
          />

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                {name || t('noName')}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
                {emailVerified ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t('emailVerified')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t('emailNotVerified')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={getPlanBadgeVariant(plan)} className="gap-1 capitalize">
                <Shield className="h-3.5 w-3.5" />
                {plan} {t('plan')}
              </Badge>

              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('memberSince')} {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {(stats || statsLoading) && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('totalConversions')}</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalConversions?.toLocaleString() ?? 0}</p>
                )}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('totalFiles')}</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalFiles?.toLocaleString() ?? 0}</p>
                )}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('thisMonth')}</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.thisMonthConversions?.toLocaleString() ?? 0}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
