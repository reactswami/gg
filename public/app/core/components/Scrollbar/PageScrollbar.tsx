/**
 * PageScrollbar
 *
 * React port of the pageScrollbar Angular directive (components/scroll/page_scroll.ts).
 *
 * The Angular directive watched 'dash-scroll' appEvents and managed scroll
 * position on route changes. This React version exposes:
 *
 *   1. <PageScrollbar> — drop-in wrapper component (replaces the attribute directive)
 *   2. usePageScrollbar() — hook for components that manage their own scroll ref
 *
 * Usage as component:
 *   <PageScrollbar className="scroll-canvas">
 *     <div ng-view /> or page content
 *   </PageScrollbar>
 *
 * Usage as hook:
 *   const scrollRef = usePageScrollbar();
 *   <div ref={scrollRef} tabIndex={-1}>...</div>
 */

import React, { useRef, useEffect, RefObject } from 'react';
import { useAppEvents } from 'app/core/hooks/useAppEvents';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePageScrollbar(): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  const lastPosRef = useRef(0);

  // Handle dash-scroll events
  useAppEvents('dash-scroll', (evt: { restore?: boolean; animate?: boolean; pos?: number }) => {
    const el = ref.current;
    if (!el) return;

    if (evt.restore) {
      el.scrollTop = lastPosRef.current;
      return;
    }

    lastPosRef.current = el.scrollTop;
    const targetPos = evt.pos ?? 0;

    if (evt.animate) {
      // Simple CSS-smooth scroll instead of jQuery animate
      el.style.scrollBehavior = 'smooth';
      el.scrollTop = targetPos;
      setTimeout(() => {
        if (el) el.style.scrollBehavior = '';
      }, 500);
    } else {
      el.scrollTop = targetPos;
    }
  });

  // Reset scroll on route change
  useAppEvents('location-change', () => {
    const el = ref.current;
    if (!el) return;
    lastPosRef.current = 0;
    el.scrollTop = 0;
    el.focus({ preventScroll: true });
  });

  // Initial focus to allow keyboard scrolling
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    }
  }, []);

  return ref;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PageScrollbarProps {
  className?: string;
  children: React.ReactNode;
}

const PageScrollbar: React.FC<PageScrollbarProps> = ({ className, children }) => {
  const ref = usePageScrollbar();

  return (
    <div ref={ref} className={className} style={{ overflowY: 'auto', height: '100%' }}>
      {children}
    </div>
  );
};

export default PageScrollbar;
