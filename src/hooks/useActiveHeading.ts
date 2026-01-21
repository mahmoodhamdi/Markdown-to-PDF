'use client';

import { useState, useEffect } from 'react';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Custom hook to track which heading is currently in view.
 * Uses IntersectionObserver to detect which heading is visible.
 */
export function useActiveHeading(headings: HeadingItem[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting from top
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Sort by top position and get the topmost visible heading
          const topmost = visibleEntries.reduce((prev, current) => {
            const prevTop = prev.boundingClientRect.top;
            const currentTop = current.boundingClientRect.top;
            return currentTop < prevTop ? current : prev;
          });
          setActiveId(topmost.target.id);
        }
      },
      {
        // Trigger when heading enters top 20% of viewport
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

/**
 * Scroll to a heading element with smooth animation.
 */
export function scrollToHeading(id: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
