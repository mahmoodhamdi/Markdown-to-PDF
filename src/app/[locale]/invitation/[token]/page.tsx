'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Check, X, AlertCircle, LogIn, Shield } from 'lucide-react';

interface InvitationData {
  id: string;
  teamId: string;
  teamName: string;
  email: string;
  role: 'admin' | 'member';
  inviterName: string;
  inviterEmail: string;
  status: string;
  expiresAt: string;
}

export default function InvitationPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const t = useTranslations('invitation');
  const locale = useLocale();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; action: 'accept' | 'decline' } | null>(null);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setInvitation(data.invitation);
        } else {
          setError(data.error || 'Invitation not found');
        }
      } catch (err) {
        console.error('Failed to fetch invitation:', err);
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!session?.user) {
      // Redirect to sign in
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setActionResult({ success: true, action: 'accept' });
        // Redirect to team page after a short delay
        setTimeout(() => {
          router.push(`/${locale}/dashboard/teams/${data.teamId}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setActionResult({ success: true, action: 'decline' });
      } else {
        setError(data.error || 'Failed to decline invitation');
      }
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      setError('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const isExpired = invitation ? new Date(invitation.expiresAt) < new Date() : false;
  const emailMismatch = session?.user?.email && invitation &&
    session.user.email.toLowerCase() !== invitation.email.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('error')}</CardTitle>
            <CardDescription>{error || t('notFound')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href={`/${locale}`}>{t('goHome')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actionResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              actionResult.action === 'accept' ? 'bg-green-100' : 'bg-muted'
            }`}>
              {actionResult.action === 'accept' ? (
                <Check className="h-6 w-6 text-green-600" />
              ) : (
                <X className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <CardTitle>
              {actionResult.action === 'accept' ? t('acceptedTitle') : t('declinedTitle')}
            </CardTitle>
            <CardDescription>
              {actionResult.action === 'accept'
                ? t('acceptedDescription', { teamName: invitation.teamName })
                : t('declinedDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {actionResult.action === 'accept' ? (
              <p className="text-sm text-muted-foreground">{t('redirecting')}</p>
            ) : (
              <Button asChild>
                <Link href={`/${locale}`}>{t('goHome')}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>{t('alreadyProcessed')}</CardTitle>
            <CardDescription>
              {invitation.status === 'accepted'
                ? t('alreadyAccepted')
                : invitation.status === 'declined'
                ? t('alreadyDeclined')
                : t('expired')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href={`/${locale}`}>{t('goHome')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('expiredTitle')}</CardTitle>
            <CardDescription>{t('expiredDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href={`/${locale}`}>{t('goHome')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{t('team')}</p>
            <p className="text-xl font-semibold">{invitation.teamName}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                {invitation.role === 'admin' ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {t(`role.${invitation.role}`)}
              </Badge>
            </div>
          </div>

          {/* Inviter Info */}
          <div className="text-center text-sm text-muted-foreground">
            {t('invitedBy', { name: invitation.inviterName })}
          </div>

          {/* Email Mismatch Warning */}
          {emailMismatch && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">{t('emailMismatchTitle')}</p>
              <p>{t('emailMismatchDescription', { email: invitation.email })}</p>
            </div>
          )}

          {/* Not signed in */}
          {authStatus === 'unauthenticated' && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t('signInRequired')}</p>
              <Button onClick={() => signIn(undefined, { callbackUrl: window.location.href })}>
                <LogIn className="h-4 w-4 me-2" />
                {t('signIn')}
              </Button>
            </div>
          )}

          {/* Actions */}
          {authStatus === 'authenticated' && !emailMismatch && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDecline}
                disabled={processing}
              >
                <X className="h-4 w-4 me-2" />
                {t('decline')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleAccept}
                disabled={processing}
              >
                <Check className="h-4 w-4 me-2" />
                {processing ? t('accepting') : t('accept')}
              </Button>
            </div>
          )}

          {/* Email mismatch - sign out and sign in with correct account */}
          {emailMismatch && (
            <div className="text-center">
              <Button variant="outline" onClick={() => signIn(undefined, { callbackUrl: window.location.href })}>
                {t('signInWithDifferentAccount')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
