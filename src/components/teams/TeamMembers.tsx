'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, MoreHorizontal, UserMinus, ShieldCheck, ShieldOff, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  image?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin' | 'member'>('all');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return email?.[0].toUpperCase() || '?';
  };

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.email.toLowerCase().includes(query) ||
          (m.name && m.name.toLowerCase().includes(query))
      );
    }

    // Sort: owner first, then admins, then members
    result.sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    });

    return result;
  }, [members, roleFilter, searchQuery]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
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
          {/* Search and Filter */}
          {members.length > 3 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchMembers')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="h-4 w-4 me-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  <SelectItem value="owner">{t('filter.owners')}</SelectItem>
                  <SelectItem value="admin">{t('filter.admins')}</SelectItem>
                  <SelectItem value="member">{t('filter.members')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Members List */}
          {filteredAndSortedMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || roleFilter !== 'all' ? t('noMatchingMembers') : t('noMembers')}
            </div>
          ) : (
          <div className="divide-y">
            {filteredAndSortedMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image} alt={member.name || member.email} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.name, member.email)}
                    </AvatarFallback>
                  </Avatar>
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
          )}
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
