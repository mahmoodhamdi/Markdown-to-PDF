'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded MarkdownEditor component
 * Monaco Editor is a large library (~2MB), so we lazy load it
 * to improve initial page load performance
 */
export const LazyMarkdownEditor = dynamic(
  () => import('./MarkdownEditor').then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

function EditorSkeleton() {
  return (
    <div className="w-full h-full bg-muted/30 flex flex-col p-4 gap-2">
      <div className="flex gap-2">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="flex-1 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
