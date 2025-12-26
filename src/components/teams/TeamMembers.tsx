'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Shield, User, Plus, MoreHorizontal, UserMinus, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  invitedBy?: string;
}

interface TeamMembersProps {
  teamId: string;
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  canManageMembers: boolean;
  canChangeRoles: boolean;
  onAddMember: () => void;
  onMemberRemoved: (memberId: string) => void;
  onMemberRoleChanged: (memberId: string, newRole: 'admin' | 'member') => void;
}

export function TeamMembers({
  teamId,
  members,
  currentUserId,
  currentUserRole,
  canManageMembers,
  canChangeRoles,
  onAddMember,
  onMemberRemoved,
  onMemberRoleChanged,
}: TeamMembersProps) {
  const t = useTranslations('dashboard.teams.detail');
  const locale = useLocale();

  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
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

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsRemoving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${removingMember.userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('memberRemoved'));
        onMemberRemoved(removingMember.userId);
      } else {
        toast.error(data.error || t('removeError'));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(t('removeError'));
    } finally {
      setIsRemoving(false);
      setRemovingMember(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    setIsChangingRole(memberId);
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('roleChanged'));
        onMemberRoleChanged(memberId, newRole);
      } else {
        toast.error(data.error || t('roleChangeError'));
      }
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error(t('roleChangeError'));
    } finally {
      setIsChangingRole(null);
    }
  };

  const canRemoveMember = (member: TeamMember) => {
    // Owner cannot be removed
    if (member.role === 'owner') return false;
    // Users can remove themselves
    if (member.userId === currentUserId) return true;
    // Owners can remove anyone
    if (currentUserRole === 'owner') return true;
    // Admins can remove members
    if (currentUserRole === 'admin' && member.role === 'member') return true;
    return false;
  };

  const isPending = (member: TeamMember) => {
    return member.userId.startsWith('pending_');
  };

  // Sort members: owner first, then admins, then members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {t('membersTitle')}
            <Badge variant="secondary">{members.length}</Badge>
          </CardTitle>
          {canManageMembers && (
            <Button size="sm" onClick={onAddMember}>
              <Plus className="h-4 w-4 me-2" />
              {t('addMember')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {sortedMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.name || member.email.split('@')[0]}
                      </span>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                        {t(`role.${member.role}`)}
                      </Badge>
                      {isPending(member) && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {t('pending')}
                        </Badge>
                      )}
                      {member.userId === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          {t('you')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {t('joined')} {formatDate(member.joinedAt)}
                  </span>

                  {(canManageMembers || member.userId === currentUserId) && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isChangingRole === member.userId}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canChangeRoles && (
                          <>
                            {member.role === 'member' ? (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.userId, 'admin')}
                              >
                                <ShieldCheck className="h-4 w-4 me-2" />
                                {t('makeAdmin')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.userId, 'member')}
                              >
                                <ShieldOff className="h-4 w-4 me-2" />
                                {t('removeAdmin')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {canRemoveMember(member) && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setRemovingMember(member)}
                          >
                            <UserMinus className="h-4 w-4 me-2" />
                            {member.userId === currentUserId ? t('leaveTeam') : t('removeMember')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removingMember?.userId === currentUserId
                ? t('leaveTeamTitle')
                : t('removeMemberTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removingMember?.userId === currentUserId
                ? t('leaveTeamDescription')
                : t('removeMemberDescription', { name: removingMember?.name || removingMember?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? t('removing') : t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
