'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Users, Crown, Shield, User, Calendar, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMemberPreview {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface Team {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
  isOwner: boolean;
  createdAt: string;
  lastActivity?: string;
  memberPreviews?: TeamMemberPreview[];
}

interface TeamCardProps {
  team: Team;
  currentUserId: string;
}

export function TeamCard({ team, currentUserId: _currentUserId }: TeamCardProps) {
  const t = useTranslations('dashboard.teams');
  const locale = useLocale();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    return formatDate(dateString);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getPlanBadgeClass = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'team':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pro':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold truncate">{team.name}</h3>
              <Badge variant={getRoleBadgeVariant(team.role)} className="gap-1 shrink-0">
                {getRoleIcon(team.role)}
                {t(`role.${team.role}`)}
              </Badge>
              <Badge className={cn('shrink-0', getPlanBadgeClass(team.plan))}>
                {team.plan}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>
                  {team.memberCount} {team.memberCount === 1 ? t('member') : t('members')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {team.isOwner ? t('created') : t('joined')} {formatDate(team.createdAt)}
                </span>
              </div>

              {team.lastActivity && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{t('lastActive')} {formatRelativeTime(team.lastActivity)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Member Avatars & Actions */}
          <div className="flex items-center gap-4">
            {team.memberPreviews && team.memberPreviews.length > 0 && (
              <AvatarGroup
                members={team.memberPreviews}
                max={4}
                size="sm"
                className="hidden sm:flex"
              />
            )}

            <div className="flex items-center gap-2">
              {team.isOwner || team.role === 'admin' ? (
                <>
                  <Button variant="outline" size="icon" asChild className="hidden sm:flex">
                    <Link href={`/${locale}/dashboard/teams/${team.id}?tab=settings`}>
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">{t('settings')}</span>
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/${locale}/dashboard/teams/${team.id}`}>{t('manage')}</Link>
                  </Button>
                </>
              ) : (
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/dashboard/teams/${team.id}`}>{t('view')}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
