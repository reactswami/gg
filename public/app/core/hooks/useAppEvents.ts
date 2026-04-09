/**
 * useAppEvents hook
 *
 * Subscribes a React component to the global Angular appEvents emitter
 * (app/core/app_events) and automatically unsubscribes on unmount.
 *
 * This lets React components react to app-wide events (show-dash-search,
 * location-change, etc.) that Angular still emits, without having to
 * pass callbacks through prop chains or touch the event system.
 *
 * Usage:
 *
 *   useAppEvents('show-dash-search', (payload) => {
 *     setSearchOpen(true);
 *   });
 *
 * Once all emitters of a given event are migrated to React/Redux, replace
 * usages of this hook with Redux dispatches or React context.
 */

import { useEffect } from 'react';
import appEvents from 'app/core/app_events';

type EventHandler<T = any> = (payload: T) => void;

/**
 * Subscribe to an appEvents channel for the lifetime of the component.
 *
 * @param eventName  The event name string (e.g. 'show-dash-search')
 * @param handler    Callback invoked when the event fires
 */
export function useAppEvents<T = any>(eventName: string, handler: EventHandler<T>): void {
  useEffect(() => {
    // appEvents.on returns an unsubscribe function in this codebase's Emitter
    appEvents.on(eventName, handler);

    return () => {
      appEvents.off(eventName, handler);
    };
  // Re-subscribe only if the event name changes — NOT on every handler
  // re-creation, which would cause subscribe/unsubscribe churn.
  // Consumers should memoize the handler if the identity matters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);
}

/**
 * Emit an appEvents event from a React component.
 * Returns a stable emitter function — safe to call in event handlers.
 *
 * Usage:
 *   const emitSearch = useEmitAppEvent('show-dash-search');
 *   <button onClick={() => emitSearch({ starred: true })}>Search</button>
 */
export function useEmitAppEvent(eventName: string) {
  return (payload?: any) => appEvents.emit(eventName, payload);
}
