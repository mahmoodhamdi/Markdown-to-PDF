'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from './AvatarUpload';
import { Mail, Calendar, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  email: string;
  image: string;
  plan: string;
  emailVerified: boolean | null;
  createdAt: string;
  onAvatarChange: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
}

export function ProfileHeader({
  name,
  email,
  image,
  plan,
  emailVerified,
  createdAt,
  onAvatarChange,
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
      </CardContent>
    </Card>
  );
}
