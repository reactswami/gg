/**
 * Utility hooks
 *
 * React equivalents of the remaining Angular utility directives that cannot
 * be replaced by a component but are used throughout templates via attributes.
 *
 * These hooks are used in new React components and gradually replace their
 * Angular counterparts as templates are converted.
 *
 * Directives replaced:
 *   give-focus        → useGiveFocus
 *   watch-change      → handled natively via onChange in React
 *   rebuild-on-change → useRebuildOnChange
 *   dash-class        → useDashClass
 *   ng-model-onblur   → useOnBlurModel
 */

import { useEffect, useRef, RefObject, useCallback } from 'react';
import { useAppEvents } from './useAppEvents';

// ---------------------------------------------------------------------------
// useGiveFocus
//
// Replaces the give-focus Angular directive.
// Focuses the element and positions the cursor at the end when `active` is true.
//
// Usage:
//   const ref = useGiveFocus(isSearchTabFocused);
//   <input ref={ref} type="text" />
// ---------------------------------------------------------------------------

export function useGiveFocus<T extends HTMLElement>(active: boolean): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const timer = setTimeout(() => {
      el.focus();
      if ('setSelectionRange' in el) {
        const input = el as unknown as HTMLInputElement;
        const pos = input.value.length * 2;
        input.setSelectionRange(pos, pos);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [active]);

  return ref;
}

// ---------------------------------------------------------------------------
// useRebuildOnChange
//
// Replaces the rebuild-on-change Angular directive.
// Returns a stable key that increments whenever `value` changes — use it as
// the `key` prop on a component to force a full remount.
//
// Usage:
//   const rebuildKey = useRebuildOnChange(panel.type);
//   <MyEditor key={rebuildKey} />
// ---------------------------------------------------------------------------

export function useRebuildOnChange(value: any): number {
  const countRef = useRef(0);
  const prevRef = useRef(value);

  if (prevRef.current !== value) {
    prevRef.current = value;
    countRef.current += 1;
  }

  return countRef.current;
}

// ---------------------------------------------------------------------------
// useDashClass
//
// Replaces the dash-class Angular directive.
// Manages 'panel-in-fullscreen' and 'dashboard-page--settings-open' body
// classes based on dashboard state changes.
//
// Usage:
//   useDashClass(dashboard);
// ---------------------------------------------------------------------------

export function useDashClass(dashboard: any) {
  const bodyRef = useRef(document.body);

  // Track fullscreen panels via dashboard events
  useEffect(() => {
    if (!dashboard?.events) return;

    const handler = (panel: any) => {
      if (panel.fullscreen) {
        bodyRef.current.classList.add('panel-in-fullscreen');
      } else {
        setTimeout(() => {
          bodyRef.current.classList.remove('panel-in-fullscreen');
        }, 0);
      }
    };

    dashboard.events.on('view-mode-changed', handler);
    // Set initial state
    bodyRef.current.classList.toggle(
      'panel-in-fullscreen',
      dashboard.meta?.fullscreen === true
    );

    return () => {
      dashboard.events.off('view-mode-changed', handler);
    };
  }, [dashboard]);

  // Track settings panel open/close via URL search param
  useEffect(() => {
    const handleLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const editview = params.get('editview');

      if (editview) {
        bodyRef.current.classList.add('dashboard-page--settings-opening');
        setTimeout(() => {
          bodyRef.current.classList.add('dashboard-page--settings-open');
        }, 10);
      } else {
        bodyRef.current.classList.remove('dashboard-page--settings-opening');
        bodyRef.current.classList.remove('dashboard-page--settings-open');
      }
    };

    window.addEventListener('popstate', handleLocation);
    handleLocation(); // run immediately

    return () => window.removeEventListener('popstate', handleLocation);
  }, []);
}

// ---------------------------------------------------------------------------
// useOnBlurModel
//
// Replaces the ng-model-onblur Angular directive.
// Returns an onBlur handler that triggers the provided onChange only when
// the input loses focus, preventing mid-type updates.
//
// Usage:
//   const handleBlur = useOnBlurModel(value, onChange);
//   <input value={value} onChange={e => setLocal(e.target.value)} onBlur={handleBlur} />
// ---------------------------------------------------------------------------

export function useOnBlurModel(
  getValue: () => string,
  onChange: (value: string) => void
): () => void {
  return useCallback(() => {
    onChange(getValue());
  }, [getValue, onChange]);
}

// ---------------------------------------------------------------------------
// useClipboard
//
// Replaces the clipboard-button Angular directive.
// Returns a ref to attach to a button and a handler that copies text.
//
// Usage:
//   const { ref, copy } = useClipboard(() => someText);
//   <button ref={ref} onClick={copy}>Copy</button>
// ---------------------------------------------------------------------------

import { useEmitAppEvent } from './useAppEvents';

export function useClipboard(getText: () => string) {
  const emitSuccess = useEmitAppEvent('alert-success');

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText());
      emitSuccess(['Content copied to clipboard']);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = getText();
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      emitSuccess(['Content copied to clipboard']);
    }
  }, [getText, emitSuccess]);

  return { copy };
}
