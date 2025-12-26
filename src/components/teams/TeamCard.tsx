'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, User, Calendar } from 'lucide-react';

export interface Team {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
  isOwner: boolean;
  createdAt: string;
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

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Team Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{team.name}</h3>
              <Badge variant={getRoleBadgeVariant(team.role)} className="gap-1">
                {getRoleIcon(team.role)}
                {t(`role.${team.role}`)}
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {team.isOwner || team.role === 'admin' ? (
              <Button asChild>
                <Link href={`/${locale}/dashboard/teams/${team.id}`}>{t('manage')}</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/${locale}/dashboard/teams/${team.id}`}>{t('view')}</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
