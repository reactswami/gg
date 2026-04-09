/**
 * GrafanaApp React root
 *
 * Extracts the app-level side effects from GrafanaCtrl (routes/GrafanaCtrl.ts)
 * into React hooks. During the migration this component is mounted as a sibling
 * to the Angular <grafana-app> element so both can coexist.
 *
 * Migration path:
 *   Phase 1 (now): Mount <GrafanaAppRoot> via ReactDOM next to <grafana-app>.
 *                  Keep GrafanaCtrl alive — it still owns configureStore(),
 *                  service singletons, and $rootScope wiring.
 *   Phase 2:       Move service init (setBackendSrv, configureStore, etc.) here.
 *   Phase 3:       Delete GrafanaCtrl and the <grafana-app> Angular directive.
 *
 * Side effects managed here (migrated from grafanaAppDirective link fn):
 *   - Sidemenu open/close body classes via appEvents
 *   - Kiosk / view-mode body classes
 *   - Inactive user detection (body class after 5 min inactivity)
 *   - Tooltip / dropdown cleanup on route change
 *   - Body click: dropdown-menu-open cleanup, click-auto-hide, popover hide
 *
 * NOT yet moved here (still in GrafanaCtrl / Angular):
 *   - configureStore()
 *   - setBackendSrv / setDatasourceSrv / setTimeSrv
 *   - $rootScope.appEvent / $rootScope.onAppEvent bridge
 *   - $routeChangeSuccess handler (needs Angular $route)
 */

import { useEffect, useRef } from 'react';
import $ from 'jquery';
import { useAppEvents } from 'app/core/hooks/useAppEvents';
import { contextSrv } from 'app/core/services/context_srv';
import appEvents from 'app/core/app_events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'tv' | '1' | true | false | string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyViewModeBodyClass(body: JQuery, mode: ViewMode, sidemenuOpen: boolean) {
  body.removeClass('view-mode--tv view-mode--kiosk view-mode--inactive');

  let ssmode = 'normal';

  switch (mode) {
    case 'tv':
      body.removeClass('sidemenu-open');
      body.addClass('view-mode--tv');
      break;
    case '1':
    case true:
      body.removeClass('sidemenu-open');
      body.addClass('view-mode--kiosk');
      ssmode = 'fullscreen';
      break;
    default:
      body.toggleClass('sidemenu-open', sidemenuOpen);
  }

  if (window.parent && (window.parent as any).toggle_fullscreen) {
    (window.parent as any).toggle_fullscreen(ssmode);
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useSidemenuBodyClass() {
  const sidemenuOpenRef = useRef(contextSrv.sidemenu);
  const body = $('body');

  useEffect(() => {
    body.toggleClass('sidemenu-open', sidemenuOpenRef.current);
  }, []);

  useAppEvents('toggle-sidemenu', () => {
    sidemenuOpenRef.current = contextSrv.sidemenu;
    body.toggleClass('sidemenu-open');
  });

  useAppEvents('toggle-sidemenu-mobile', () => {
    body.toggleClass('sidemenu-open--xs');
  });

  useAppEvents('toggle-sidemenu-hidden', () => {
    body.toggleClass('sidemenu-hidden');
  });

  return sidemenuOpenRef;
}

function useKioskMode(sidemenuOpenRef: React.MutableRefObject<boolean>) {
  useAppEvents('toggle-kiosk-mode', (options: { exit?: boolean }) => {
    const search = new URLSearchParams(window.location.search);
    const currentKiosk = search.get('kiosk');

    if (options?.exit) {
      search.set('kiosk', '1');
    } else {
      switch (currentKiosk) {
        case 'tv':
          search.set('kiosk', 'true');
          appEvents.emit('alert-success', ['Press ESC to exit fullscreen mode']);
          break;
        case '1':
        case 'true':
          search.delete('kiosk');
          break;
        default:
          search.set('kiosk', 'tv');
      }
    }

    applyViewModeBodyClass($('body'), search.get('kiosk') as ViewMode, sidemenuOpenRef.current);
  });
}

function useInactivityDetection() {
  useEffect(() => {
    const body = $('body');
    const INACTIVE_LIMIT = 60 * 5000;
    let lastActivity = Date.now();
    let activeUser = true;

    function checkInactive() {
      if (!activeUser || !body.hasClass('page-dashboard')) return;
      if (Date.now() - lastActivity > INACTIVE_LIMIT) {
        activeUser = false;
        body.addClass('view-mode--inactive').removeClass('sidemenu-open');
      }
    }

    function onActivity() {
      lastActivity = Date.now();
      if (!activeUser) {
        activeUser = true;
        body.removeClass('view-mode--inactive');
      }
    }

    body.on('mousemove keydown', onActivity);
    document.addEventListener('wheel', onActivity, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onActivity);

    const interval = setInterval(checkInactive, 2000);

    const unsub = appEvents.on('toggle-view-mode', () => {
      lastActivity = 0;
      checkInactive();
    });

    return () => {
      body.off('mousemove keydown', onActivity);
      document.removeEventListener('wheel', onActivity, { capture: true });
      document.removeEventListener('visibilitychange', onActivity);
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, []);
}

function useBodyClickHandler() {
  useEffect(() => {
    const body = $('body');

    function handleClick(evt: JQuery.ClickEvent) {
      const target = $(evt.target);
      if (target.parents().length === 0) return;

      // Close open dropdowns
      body.find('.dropdown-menu-open').removeClass('dropdown-menu-open');

      // click-auto-hide: detach element briefly to trigger animations
      const clickAutoHide = target.closest('[data-click-hide]');
      if (clickAutoHide.length) {
        const parent = clickAutoHide.parent();
        clickAutoHide.detach();
        setTimeout(() => parent.append(clickAutoHide), 100);
      }

      // Hide popovers when clicking outside graph legend
      const popover = body.find('.popover');
      if (popover.length > 0 && target.parents('.graph-legend').length === 0) {
        popover.hide();
      }
    }

    body.on('click', handleClick);
    return () => body.off('click', handleClick);
  }, []);
}

// ---------------------------------------------------------------------------
// GrafanaAppRoot
//
// Headless component — renders nothing, only manages side effects.
// Mount once near the top of the React tree.
// ---------------------------------------------------------------------------

const GrafanaAppRoot: React.FC = () => {
  const sidemenuOpenRef = useSidemenuBodyClass();
  useKioskMode(sidemenuOpenRef);
  useInactivityDetection();
  useBodyClickHandler();

  // Server-side render detection (phantom.js / headless)
  useEffect(() => {
    if (document.cookie.indexOf('renderKey') !== -1) {
      $('body').addClass('body--phantomjs');
    }
  }, []);

  return null; // headless — no DOM output
};

export default GrafanaAppRoot;
