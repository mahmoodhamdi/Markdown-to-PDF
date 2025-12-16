import { cn } from '@/lib/utils';

/**
 * Skeleton component for loading states.
 * Displays an animated placeholder while content is loading.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

/**
 * Pre-built skeleton for card content.
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Pre-built skeleton for text lines.
 */
function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * Pre-built skeleton for preview content.
 */
function PreviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <Skeleton className="h-8 w-1/2" />
      <TextSkeleton lines={4} />
      <Skeleton className="h-4 w-full" />
      <TextSkeleton lines={3} />
      <Skeleton className="h-32 w-full" />
      <TextSkeleton lines={2} />
    </div>
  );
}

/**
 * Pre-built skeleton for editor content.
 */
function EditorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('h-full p-4 space-y-2', className)}>
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-5"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Pre-built skeleton for toolbar buttons.
 */
function ToolbarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 p-2', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8 rounded" />
      ))}
      <Skeleton className="h-6 w-px mx-1" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8 rounded" />
      ))}
    </div>
  );
}

/**
 * Pre-built skeleton for template cards.
 */
function TemplateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex gap-2 mt-auto">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  TextSkeleton,
  PreviewSkeleton,
  EditorSkeleton,
  ToolbarSkeleton,
  TemplateCardSkeleton,
};
