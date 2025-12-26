'use client';

import { useTranslations } from 'next-intl';
import {
  UserPlus,
  UserMinus,
  UserCheck,
  Settings,
  Shield,
  LogOut,
  Mail,
  MailX,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

interface ActivityData {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

interface ActivityItemProps {
  activity: ActivityData;
}

const actionIcons: Record<string, LucideIcon> = {
  team_created: Plus,
  team_deleted: Trash2,
  team_updated: Settings,
  member_invited: Mail,
  member_joined: UserCheck,
  member_removed: UserMinus,
  member_left: LogOut,
  role_changed: Shield,
  settings_updated: Settings,
  invitation_canceled: MailX,
  invitation_resent: Mail,
};

const actionColors: Record<string, string> = {
  team_created: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  team_deleted: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  team_updated: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  member_invited: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  member_joined: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  member_removed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  member_left: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  role_changed: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  settings_updated: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  invitation_canceled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  invitation_resent: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const t = useTranslations('dashboard.teams.activity');
  const Icon = actionIcons[activity.action] || UserPlus;
  const colorClass = actionColors[activity.action] || 'bg-gray-100 text-gray-600';

  const actorName = activity.userName || activity.userEmail.split('@')[0];

  const getActivityDescription = () => {
    const details = activity.details;

    switch (activity.action) {
      case 'team_created':
        return t('actions.teamCreated', { actor: actorName });

      case 'team_deleted':
        return t('actions.teamDeleted', { actor: actorName });

      case 'team_updated':
        return t('actions.teamUpdated', { actor: actorName });

      case 'member_invited':
        return t('actions.memberInvited', {
          actor: actorName,
          email: (details.invitedEmail as string) || 'unknown',
          role: (details.role as string) || 'member',
        });

      case 'member_joined':
        return t('actions.memberJoined', { actor: actorName });

      case 'member_removed':
        return t('actions.memberRemoved', {
          actor: actorName,
          member: (details.removedName as string) || (details.removedEmail as string) || 'unknown',
        });

      case 'member_left':
        return t('actions.memberLeft', { actor: actorName });

      case 'role_changed':
        return t('actions.roleChanged', {
          actor: actorName,
          member: (details.memberName as string) || (details.memberEmail as string) || 'unknown',
          oldRole: (details.oldRole as string) || 'member',
          newRole: (details.newRole as string) || 'member',
        });

      case 'settings_updated':
        return t('actions.settingsUpdated', { actor: actorName });

      case 'invitation_canceled':
        return t('actions.invitationCanceled', {
          actor: actorName,
          email: (details.invitedEmail as string) || 'unknown',
        });

      case 'invitation_resent':
        return t('actions.invitationResent', {
          actor: actorName,
          email: (details.invitedEmail as string) || 'unknown',
        });

      default:
        return t('actions.unknown', { actor: actorName, action: activity.action });
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('time.justNow');
    } else if (diffMins < 60) {
      return t('time.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return t('time.hoursAgo', { count: diffHours });
    } else if (diffDays === 1) {
      return t('time.yesterday');
    } else if (diffDays < 7) {
      return t('time.daysAgo', { count: diffDays });
    } else {
      return activityDate.toLocaleDateString();
    }
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{getActivityDescription()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}
