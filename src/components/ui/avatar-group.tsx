'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AvatarGroupMember {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

interface AvatarGroupProps {
  members: AvatarGroupMember[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

const overflowSizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

function getDisplayName(member: AvatarGroupMember): string {
  return member.name || member.email?.split('@')[0] || 'Unknown';
}

export function AvatarGroup({
  members,
  max = 5,
  size = 'md',
  showTooltip = true,
  className,
}: AvatarGroupProps) {
  const visibleMembers = members.slice(0, max);
  const remainingCount = Math.max(0, members.length - max);

  const avatarContent = (
    <div className={cn('flex -space-x-2', className)}>
      {visibleMembers.map((member, index) => (
        <Avatar
          key={member.id || member.email || index}
          className={cn(
            sizeClasses[size],
            'border-2 border-background ring-0 transition-transform hover:z-10 hover:scale-110'
          )}
        >
          <AvatarImage src={member.image} alt={getDisplayName(member)} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(member.name, member.email)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            overflowSizeClasses[size],
            'flex items-center justify-center rounded-full bg-muted border-2 border-background font-medium text-muted-foreground'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );

  if (!showTooltip || members.length === 0) {
    return avatarContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{avatarContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm">
            {visibleMembers.map((member, index) => (
              <div key={member.id || member.email || index}>{getDisplayName(member)}</div>
            ))}
            {remainingCount > 0 && (
              <div className="text-muted-foreground">+{remainingCount} more</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
