'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
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
import { Link2, Link2Off, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FaGithub, FaGoogle } from 'react-icons/fa';

interface ConnectedAccount {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  accountId?: string;
  providerEmail?: string;
  providerName?: string;
  connectedAt?: string;
}

interface ConnectedAccountsProps {
  hasPassword: boolean;
}

export function ConnectedAccounts({ hasPassword }: ConnectedAccountsProps) {
  const t = useTranslations('security');

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/accounts');
      const data = await response.json();

      if (response.ok && data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      // Use NextAuth signIn with redirect to link account
      await signIn(provider, {
        callbackUrl: window.location.href,
      });
    } catch (error) {
      console.error('Connect account error:', error);
      toast.error(t('accounts.connectFailed'));
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setDisconnecting(provider);

    try {
      const response = await fetch(`/api/users/accounts/${provider}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('accounts.disconnected'));
        setAccounts(
          accounts.map((a) =>
            a.id === provider
              ? { ...a, connected: false, accountId: undefined, providerEmail: undefined }
              : a
          )
        );
      } else {
        toast.error(data.error || t('accounts.disconnectFailed'));
      }
    } catch (error) {
      console.error('Disconnect account error:', error);
      toast.error(t('accounts.disconnectFailed'));
    } finally {
      setDisconnecting(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <FaGithub className="h-5 w-5" />;
      case 'google':
        return <FaGoogle className="h-5 w-5" />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  const canDisconnect = (_account: ConnectedAccount) => {
    // Can disconnect if user has password or has another connected account
    const connectedCount = accounts.filter((a) => a.connected).length;
    return hasPassword || connectedCount > 1;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t('accounts.title')}
        </CardTitle>
        <CardDescription>{t('accounts.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`flex items-center gap-4 p-4 border rounded-lg ${
              account.connected ? '' : 'opacity-75'
            }`}
          >
            <div className="flex-shrink-0 p-2 bg-muted rounded-full">
              {getProviderIcon(account.id)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium">{account.name}</div>
              {account.connected ? (
                <div className="text-sm text-muted-foreground">
                  {account.providerName || account.providerEmail || t('accounts.connected')}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t('accounts.notConnected')}</div>
              )}
            </div>

            {account.connected ? (
              canDisconnect(account) ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={disconnecting === account.id}>
                      {disconnecting === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Link2Off className="h-4 w-4 me-1" />
                          {t('accounts.disconnect')}
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('accounts.disconnectTitle', { provider: account.name })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('accounts.disconnectDescription', { provider: account.name })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('accounts.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDisconnect(account.id)}>
                        {t('accounts.confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {t('accounts.cannotDisconnect')}
                </div>
              )
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect(account.id)}
                disabled={connecting === account.id}
              >
                {connecting === account.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 me-1" />
                    {t('accounts.connect')}
                  </>
                )}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
