'use client';

import { useTranslations } from 'next-intl';
import { TeamCard, type Team } from './TeamCard';
import { Users } from 'lucide-react';

interface TeamListProps {
  teams: Team[];
  currentUserId: string;
}

export function TeamList({ teams, currentUserId }: TeamListProps) {
  const t = useTranslations('dashboard.teams');

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('noTeams')}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('noTeamsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
