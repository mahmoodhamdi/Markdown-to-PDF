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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Crown, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  image?: string;
  role: 'owner' | 'admin' | 'member';
}

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  members: TeamMember[];
  currentOwnerId: string;
  onOwnershipTransferred: (newOwnerId: string) => void;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  members,
  currentOwnerId,
  onOwnershipTransferred,
}: TransferOwnershipDialogProps) {
  const t = useTranslations('dashboard.teams.transfer');

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Only admins can receive ownership transfer
  const eligibleMembers = members.filter((m) => m.role === 'admin' && m.userId !== currentOwnerId);

  const selectedMember = eligibleMembers.find((m) => m.userId === selectedMemberId);
  const confirmationRequired = teamName.toLowerCase();
  const isConfirmed = confirmText.toLowerCase() === confirmationRequired;

  const handleTransfer = async () => {
    if (!selectedMemberId || !isConfirmed) return;

    setIsTransferring(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: selectedMemberId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('success'), {
          description: t('successDescription', {
            name: selectedMember?.name || selectedMember?.email,
          }),
        });
        onOwnershipTransferred(selectedMemberId);
        handleClose();
      } else {
        toast.error(data.error || t('error'));
      }
    } catch (error) {
      console.error('Failed to transfer ownership:', error);
      toast.error(t('error'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    setSelectedMemberId('');
    setConfirmText('');
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Crown className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">{t('warning')}</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• {t('warningItem1')}</li>
                <li>• {t('warningItem2')}</li>
                <li>• {t('warningItem3')}</li>
              </ul>
            </div>
          </div>

          {/* Select new owner */}
          {eligibleMembers.length === 0 ? (
            <div className="text-center py-6 border rounded-lg bg-muted/30">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t('noEligibleMembers')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('noEligibleMembersHint')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t('selectNewOwner')}</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.image} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name, member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name || member.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Confirmation input */}
              {selectedMemberId && (
                <div className="space-y-2">
                  <Label htmlFor="confirmText">{t('confirmLabel')}</Label>
                  <p className="text-sm text-muted-foreground">{t('confirmHint', { teamName })}</p>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={teamName}
                    disabled={isTransferring}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isTransferring}>
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleTransfer}
            disabled={
              !selectedMemberId || !isConfirmed || isTransferring || eligibleMembers.length === 0
            }
          >
            {isTransferring ? t('transferring') : t('transferOwnership')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
