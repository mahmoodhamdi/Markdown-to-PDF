'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  LogOut,
  Clock,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  browser: string;
  os: string;
  device: string;
  ip?: string;
  location?: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export function SessionList() {
  const t = useTranslations('security');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/sessions');
      const data = await response.json();

      if (response.ok && data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);

    try {
      const response = await fetch(`/api/users/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('sessions.revoked'));
        setSessions(sessions.filter((s) => s.id !== sessionId));
      } else {
        toast.error(data.error || t('sessions.revokeFailed'));
      }
    } catch (error) {
      console.error('Revoke session error:', error);
      toast.error(t('sessions.revokeFailed'));
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);

    try {
      const response = await fetch('/api/users/sessions', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('sessions.allRevoked', { count: data.revokedCount }));
        setSessions(sessions.filter((s) => s.isCurrent));
      } else {
        toast.error(data.error || t('sessions.revokeFailed'));
      }
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      toast.error(t('sessions.revokeFailed'));
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'Tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('sessions.justNow');
    if (diffMins < 60) return t('sessions.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('sessions.hoursAgo', { count: diffHours });
    return t('sessions.daysAgo', { count: diffDays });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          {t('sessions.title')}
        </CardTitle>
        <CardDescription>{t('sessions.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('sessions.noSessions')}
          </div>
        ) : (
          <>
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  session.isCurrent ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <div className="flex-shrink-0 p-2 bg-muted rounded-full">
                  {getDeviceIcon(session.device)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {session.browser} {t('sessions.on')} {session.os}
                    </span>
                    {session.isCurrent && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        {t('sessions.current')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatLastActive(session.lastActive)}
                    </span>
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.location}
                      </span>
                    )}
                  </div>
                </div>

                {!session.isCurrent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revoking === session.id}
                      >
                        {revoking === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 me-1" />
                            {t('sessions.revoke')}
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('sessions.revokeTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('sessions.revokeDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('sessions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevokeSession(session.id)}>
                          {t('sessions.confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}

            {otherSessions.length > 0 && (
              <div className="flex justify-end pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={revokingAll}>
                      {revokingAll ? (
                        <>
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                          {t('sessions.revoking')}
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 me-2" />
                          {t('sessions.revokeAll')}
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('sessions.revokeAllTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('sessions.revokeAllDescription', { count: otherSessions.length })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('sessions.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevokeAll}>
                        {t('sessions.confirmAll')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
