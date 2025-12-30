'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Trash2, Crown } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface TeamSettingsData {
  allowMemberInvites: boolean;
  defaultMemberRole: 'member' | 'admin';
  sharedStorageEnabled: boolean;
  sharedTemplatesEnabled: boolean;
}

interface TeamSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  settings: TeamSettingsData;
  isOwner: boolean;
  hasAdmins?: boolean;
  onSettingsUpdated: (settings: TeamSettingsData) => void;
  onTeamNameUpdated: (name: string) => void;
  onTransferOwnership?: () => void;
}

export function TeamSettings({
  open,
  onOpenChange,
  teamId,
  teamName,
  settings,
  isOwner,
  hasAdmins = false,
  onSettingsUpdated,
  onTeamNameUpdated,
  onTransferOwnership,
}: TeamSettingsProps) {
  const t = useTranslations('dashboard.teams.detail');
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState(teamName);
  const [localSettings, setLocalSettings] = useState<TeamSettingsData>(settings);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          settings: localSettings,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('settingsSaved'));
        onSettingsUpdated(localSettings);
        if (name.trim() !== teamName) {
          onTeamNameUpdated(name.trim());
        }
        onOpenChange(false);
      } else {
        toast.error(data.error || t('saveError'));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('teamDeleted'));
        router.push(`/${locale}/dashboard/teams`);
      } else {
        toast.error(data.error || t('deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error(t('deleteError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to original values
      setName(teamName);
      setLocalSettings(settings);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settingsTitle')}
            </DialogTitle>
            <DialogDescription>{t('settingsDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Team Name */}
            <div className="grid gap-2">
              <Label htmlFor="teamName">{t('teamName')}</Label>
              <Input
                id="teamName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Separator />

            {/* Member Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('memberSettings')}</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('allowMemberInvites')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('allowMemberInvitesHint')}
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowMemberInvites}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, allowMemberInvites: checked }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t('defaultRole')}</Label>
                <Select
                  value={localSettings.defaultMemberRole}
                  onValueChange={(value: 'member' | 'admin') =>
                    setLocalSettings((prev) => ({ ...prev, defaultMemberRole: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t('role.member')}</SelectItem>
                    <SelectItem value="admin">{t('role.admin')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">{t('defaultRoleHint')}</p>
              </div>
            </div>

            <Separator />

            {/* Sharing Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('sharingSettings')}</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('sharedStorage')}</Label>
                  <p className="text-sm text-muted-foreground">{t('sharedStorageHint')}</p>
                </div>
                <Switch
                  checked={localSettings.sharedStorageEnabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, sharedStorageEnabled: checked }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('sharedTemplates')}</Label>
                  <p className="text-sm text-muted-foreground">{t('sharedTemplatesHint')}</p>
                </div>
                <Switch
                  checked={localSettings.sharedTemplatesEnabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, sharedTemplatesEnabled: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Danger Zone - Owner only */}
            {isOwner && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium text-destructive">{t('dangerZone')}</h4>

                  {/* Transfer Ownership */}
                  {onTransferOwnership && (
                    <div className="flex items-center justify-between p-4 border border-yellow-500/50 rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10">
                      <div className="space-y-0.5">
                        <Label>{t('transferOwnership')}</Label>
                        <p className="text-sm text-muted-foreground">{t('transferOwnershipHint')}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          onTransferOwnership();
                        }}
                        disabled={isLoading || !hasAdmins}
                      >
                        <Crown className="h-4 w-4 me-2" />
                        {t('transfer')}
                      </Button>
                    </div>
                  )}

                  {/* Delete Team */}
                  <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                    <div className="space-y-0.5">
                      <Label>{t('deleteTeam')}</Label>
                      <p className="text-sm text-muted-foreground">{t('deleteTeamHint')}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
              {isLoading ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTeamTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteTeamDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('deleting') : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
