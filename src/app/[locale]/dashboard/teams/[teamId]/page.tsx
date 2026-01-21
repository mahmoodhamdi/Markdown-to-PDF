'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ArrowLeft, Settings, Crown, Shield, User, Activity } from 'lucide-react';
import { TeamMembers } from '@/components/teams/TeamMembers';
import { AddMemberDialog } from '@/components/teams/AddMemberDialog';
import { TeamSettings } from '@/components/teams/TeamSettings';
import { ActivityLog } from '@/components/teams/ActivityLog';
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  invitedBy?: string;
}

interface TeamSettings {
  allowMemberInvites: boolean;
  defaultMemberRole: 'member' | 'admin';
  sharedStorageEnabled: boolean;
  sharedTemplatesEnabled: boolean;
}

interface TeamData {
  id: string;
  name: string;
  plan: string;
  isOwner: boolean;
  currentUserRole: 'owner' | 'admin' | 'member';
  members: TeamMember[];
  settings: TeamSettings;
  createdAt: string;
  updatedAt: string;
}

export default function TeamDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const teamId = params.teamId as string;
  const t = useTranslations('dashboard.teams.detail');
  const locale = useLocale();

  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setTeam(data.team);
      } else {
        setError(data.error || 'Failed to fetch team');
      }
    } catch (err) {
      console.error('Failed to fetch team:', err);
      setError('Failed to fetch team');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (status === 'authenticated' && teamId) {
      fetchTeam();
    }
  }, [status, teamId, fetchTeam]);

  const handleMemberAdded = (newMember: TeamMember) => {
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            members: [...prev.members, newMember],
          }
        : null
    );
    setShowAddMember(false);
  };

  const handleMemberRemoved = (memberId: string) => {
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.filter((m) => m.userId !== memberId),
          }
        : null
    );
  };

  const handleMemberRoleChanged = (memberId: string, newRole: 'admin' | 'member') => {
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.map((m) => (m.userId === memberId ? { ...m, role: newRole } : m)),
          }
        : null
    );
  };

  const handleSettingsUpdated = (newSettings: TeamSettings) => {
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            settings: newSettings,
          }
        : null
    );
    setShowSettings(false);
  };

  const handleTeamNameUpdated = (newName: string) => {
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            name: newName,
          }
        : null
    );
  };

  const canManageMembers = team?.currentUserRole === 'owner' || team?.currentUserRole === 'admin';
  const canManageSettings = team?.currentUserRole === 'owner' || team?.currentUserRole === 'admin';
  const canChangeRoles = team?.currentUserRole === 'owner';

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

  if (status === 'loading' || loading) {
    return <TeamDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/dashboard/teams`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{t('error')}</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/dashboard/teams`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Users className="h-8 w-8 text-primary" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <Badge variant="secondary" className="gap-1">
                {getRoleIcon(team.currentUserRole)}
                {t(`role.${team.currentUserRole}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {team.members.length} {team.members.length === 1 ? t('member') : t('members')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageSettings && (
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 me-2" />
              {t('settings')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Members and Activity */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            {t('tabs.members')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            {t('tabs.activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <TeamMembers
            teamId={teamId}
            members={team.members}
            currentUserId={session?.user?.id || ''}
            currentUserRole={team.currentUserRole}
            canManageMembers={canManageMembers}
            canChangeRoles={canChangeRoles}
            onAddMember={() => setShowAddMember(true)}
            onMemberRemoved={handleMemberRemoved}
            onMemberRoleChanged={handleMemberRoleChanged}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityLog
            teamId={teamId}
            canExport={team.currentUserRole === 'owner' || team.currentUserRole === 'admin'}
          />
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        teamId={teamId}
        onMemberAdded={handleMemberAdded}
        canAddAdmin={team.currentUserRole === 'owner'}
      />

      {/* Team Settings Dialog */}
      {team && (
        <TeamSettings
          open={showSettings}
          onOpenChange={setShowSettings}
          teamId={teamId}
          teamName={team.name}
          settings={team.settings}
          isOwner={team.isOwner}
          onSettingsUpdated={handleSettingsUpdated}
          onTeamNameUpdated={handleTeamNameUpdated}
        />
      )}
    </div>
  );
}

function TeamDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-24 mt-1" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
