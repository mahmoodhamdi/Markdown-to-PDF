'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Mail, Clock, RefreshCw, X, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  invitedByName?: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'expired';
}

interface PendingInvitationsProps {
  teamId: string;
  invitations: Invitation[];
  canManage: boolean;
  onInvitationCanceled: (invitationId: string) => void;
  onInvitationResent: (invitationId: string) => void;
}

export function PendingInvitations({
  teamId,
  invitations,
  canManage,
  onInvitationCanceled,
  onInvitationResent,
}: PendingInvitationsProps) {
  const t = useTranslations('dashboard.teams.invitations');
  const locale = useLocale();

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Invitation | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExpirationStatus = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs <= 0) {
      return { expired: true, text: t('expired') };
    }
    if (diffHours < 24) {
      return {
        expired: false,
        text: t('expiresIn', { time: t('time.hours', { count: diffHours }) }),
        urgent: true,
      };
    }
    return { expired: false, text: t('expiresIn', { time: t('time.days', { count: diffDays }) }) };
  };

  const handleResend = async (invitation: Invitation) => {
    setResendingId(invitation.id);
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations/${invitation.id}/resend`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('resendSuccess'));
        onInvitationResent(invitation.id);
      } else {
        toast.error(data.error || t('resendError'));
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error(t('resendError'));
    } finally {
      setResendingId(null);
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;

    setCancelingId(confirmCancel.id);
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations/${confirmCancel.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('cancelSuccess'));
        onInvitationCanceled(confirmCancel.id);
      } else {
        toast.error(data.error || t('cancelError'));
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error(t('cancelError'));
    } finally {
      setCancelingId(null);
      setConfirmCancel(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const expiredInvitations = invitations.filter((inv) => inv.status === 'expired');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {t('title')}
            <Badge variant="secondary">{invitations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Pending invitations */}
            {pendingInvitations.map((invitation) => {
              const expStatus = getExpirationStatus(invitation.expiresAt);
              return (
                <div
                  key={invitation.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    expStatus.urgent && 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{invitation.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {t(`role.${invitation.role}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>
                        {t('invitedBy', { name: invitation.invitedByName || invitation.invitedBy })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {expStatus.text}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 ms-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(invitation)}
                        disabled={resendingId === invitation.id}
                      >
                        {resendingId === invitation.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline ms-1">{t('resend')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmCancel(invitation)}
                        disabled={cancelingId === invitation.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline ms-1">{t('cancel')}</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Expired invitations */}
            {expiredInvitations.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('expiredInvitations')}
                  </span>
                </div>
                {expiredInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-dashed opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{invitation.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {t(`role.${invitation.role}`)}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          {t('expired')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('expiredOn', { date: formatDate(invitation.expiresAt) })}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-2 ms-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invitation)}
                          disabled={resendingId === invitation.id}
                        >
                          {resendingId === invitation.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="ms-1">{t('resendNew')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmCancel(invitation)}
                          disabled={cancelingId === invitation.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelDescription', { email: confirmCancel?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!cancelingId}>{t('keep')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!!cancelingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelingId ? t('canceling') : t('confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
