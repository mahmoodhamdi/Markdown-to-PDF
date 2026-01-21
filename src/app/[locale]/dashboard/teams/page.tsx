'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, AlertCircle } from 'lucide-react';
import { TeamList } from '@/components/teams/TeamList';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';

interface Team {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
  isOwner: boolean;
  createdAt: string;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard.teams');

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  const userPlan = session?.user?.plan || 'free';
  const canCreateTeam = userPlan === 'team' || userPlan === 'enterprise';

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/teams');
        const data = await response.json();

        if (response.ok && data.success) {
          setTeams(data.teams);
        } else {
          setError(data.error || 'Failed to fetch teams');
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError('Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchTeams();
    }
  }, [status]);

  const handleTeamCreated = (newTeam: Team) => {
    setTeams((prev) => [...prev, newTeam]);
    setShowCreateDialog(false);
  };

  if (status === 'loading' || loading) {
    return <TeamsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {canCreateTeam && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t('createTeam')}
          </Button>
        )}
      </div>

      {/* Upgrade prompt for free/pro users */}
      {!canCreateTeam && (
        <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{t('upgradeRequired')}</p>
            <p className="text-sm text-muted-foreground">{t('upgradeDescription')}</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/subscription">{t('viewPlans')}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Teams list */}
      <TeamList teams={teams} currentUserId={session?.user?.id || ''} />

      {/* Create team dialog */}
      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  );
}

function TeamsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
