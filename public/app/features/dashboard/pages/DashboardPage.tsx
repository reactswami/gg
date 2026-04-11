/**
 * DashboardPage
 *
 * React replacement for DashboardCtrl + dashboard.html.
 * Routes: /  /d/:uid/:slug  /d/:uid  /dashboard/:type/:slug
 *
 * Orchestrates the dashboard lifecycle using Angular services via
 * useAngularService — each service is consumed through the existing
 * singleton pattern until the service layer itself is migrated.
 *
 * Sub-components rendered here are ALL already React:
 *   DashNav, DashboardSubmenu, DashboardSettings, DashboardGrid
 *
 * Migration note:
 *   DashboardViewStateSrv still tracks panel fullscreen/edit state via
 *   URL params (?fullscreen, ?edit, ?editview). We consume it via
 *   useAngularService and watch location.search for those params.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import classNames from 'classnames';

// Already-React sub-components
import DashNav from '../components/DashNav/DashNav';
import DashboardSubmenu from '../components/DashboardSubmenu/DashboardSubmenu';
import DashboardSettings from '../components/DashboardSettings/DashboardSettings';
import { DashboardGrid } from '../dashgrid/DashboardGrid';
import PageScrollbar from 'app/core/components/Scrollbar/PageScrollbar';

// Services
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useAppEvents, useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import appEvents from 'app/core/app_events';
import locationUtil from 'app/core/utils/location_util';
import config from 'app/core/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  uid?: string;
  slug?: string;
  type?: string;
}

export interface DashboardPageProps {
  routeParams?: RouteParams;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DashboardPage: React.FC<DashboardPageProps> = ({ routeParams = {} }) => {
  const history  = useHistory();
  const location = useLocation();

  // Angular services consumed via bridge
  const backendSrv       = useAngularService<any>('backendSrv');
  const dashboardSrv     = useAngularService<any>('dashboardSrv');
  const dashboardLoaderSrv = useAngularService<any>('dashboardLoaderSrv');
  const timeSrv          = useAngularService<any>('timeSrv');
  const variableSrv      = useAngularService<any>('variableSrv');
  const alertingSrv      = useAngularService<any>('alertingSrv');
  const keybindingSrv    = useAngularService<any>('keybindingSrv');
  const unsavedChangesSrv = useAngularService<any>('unsavedChangesSrv');
  const contextSrv       = useAngularService<any>('contextSrv');

  const emitDashFetchStart = useEmitAppEvent('dashboard-fetch-start');
  const emitDashScrollRestore = useEmitAppEvent('dash-scroll');

  // ── State ─────────────────────────────────────────────────────────────────

  const [dashboard, setDashboard]  = useState<any>(null);
  const [isLoading, setIsLoading]  = useState(true);
  const [initFailed, setInitFailed] = useState(false);
  const loadedFallbackRef = useRef(false);
  const scopeRef = useRef<any>({});    // minimal $scope shim for Angular services

  // Derive view state from URL params
  const searchParams = new URLSearchParams(location.search);
  const editview     = searchParams.get('editview');
  const isSettingsOpen = !!editview;
  const isFullscreen = searchParams.has('fullscreen');

  // ── Dashboard lifecycle ───────────────────────────────────────────────────

  const onInitFailed = useCallback((msg: string, fatal: boolean, err: any) => {
    console.log(msg, err);
    const message = err?.data?.message || err?.message || String(err);
    appEvents.emit('alert-error', [msg, message]);

    if (fatal && !loadedFallbackRef.current) {
      loadedFallbackRef.current = true;
      setupDashboard({ dashboard: { title: 'Dashboard Init failed' } });
    }
  }, []);

  const setupDashboard = useCallback(async (data: any) => {
    try {
      const db = dashboardSrv.create(data.dashboard, data.meta);
      dashboardSrv.setCurrent(db);

      timeSrv.init(db);
      alertingSrv.init(db, data.alerts);

      try {
        await variableSrv.init(db);
      } catch (e) {
        onInitFailed('Templating init failed', false, e);
      }

      db.processRepeats();
      db.updateSubmenuVisibility();
      db.autoFitPanels(window.innerHeight);

      // Set up unsaved changes tracker with a minimal scope shim
      const scope = scopeRef.current;
      scope.dashboard = db;
      unsavedChangesSrv.init(db, scope);

      // Set up keyboard bindings
      keybindingSrv.setupDashboardBindings(scope, db);

      // Set window title
      setWindowTitle(db.title);

      setDashboard(db);
      setIsLoading(false);
      appEvents.emit('dashboard-initialized', db);
    } catch (err) {
      onInitFailed('Dashboard init failed', true, err);
    }
  }, [dashboardSrv, timeSrv, alertingSrv, variableSrv, unsavedChangesSrv, keybindingSrv, onInitFailed]);

  const setWindowTitle = (title: string) => {
    const params = new URLSearchParams(window.location.search);
    let fullTitle = config.windowTitlePrefix || '';
    const paramTitle = params.get('title');

    if (paramTitle) {
      fullTitle += paramTitle;
    } else {
      fullTitle += title;
    }

    if (fullTitle.trim() === '') {
      const metaEl = window.top?.document?.querySelector('meta[name="product"]');
      fullTitle = (metaEl?.getAttribute('content') || '') + ' Dashboards';
    }

    window.document.title = fullTitle;
    if (window.top !== window) {
      try { window.top!.document.title = fullTitle; } catch { /* cross-origin */ }
    }
  };

  // ── Load dashboard ────────────────────────────────────────────────────────

  useEffect(() => {
    emitDashFetchStart();
    loadDashboard();

    return () => {
      // Cleanup: destroy dashboard on unmount
      dashboardSrv.getCurrent()?.destroy?.();
      emitDashScrollRestore({ restore: true });
    };
  }, [routeParams.uid, routeParams.slug, routeParams.type]);

  const loadDashboard = async () => {
    setIsLoading(true);
    const { uid, slug, type } = routeParams;

    // Home dashboard
    if (!uid && !slug) {
      const paramForceHome = new URLSearchParams(location.search).get('forcehome');
      const homeDash = await backendSrv.get('/api/dashboards/home');
      if (homeDash.redirectUri && !paramForceHome) {
        history.replace(locationUtil.stripBaseFromUrl(homeDash.redirectUri));
        return;
      }
      homeDash.meta = homeDash.meta || {};
      homeDash.meta.canSave = homeDash.meta.canShare = homeDash.meta.canStar = false;
      await setupDashboard(homeDash);
      return;
    }

    // Legacy slug redirect
    if (!(type === 'script' || type === 'snapshot') && !uid) {
      const res = await backendSrv.getDashboardBySlug(slug);
      if (res) {
        history.replace(locationUtil.stripBaseFromUrl(res.meta.url));
      }
      return;
    }

    // Load by uid / type / slug
    const result = await dashboardLoaderSrv.loadDashboard(type, slug, uid);
    if (!result) return;

    if (result.meta.url) {
      const url = locationUtil.stripBaseFromUrl(result.meta.url);
      if (url !== location.pathname) {
        history.replace(url);
        return;
      }
    }

    const params = new URLSearchParams(location.search);
    result.meta.autofitpanels = params.get('autofitpanels');
    result.meta.embeddedMode  = params.get('embeddedMode');
    result.meta.kiosk         = params.get('kiosk');

    await setupDashboard(result);
  };

  // ── appEvents wiring ──────────────────────────────────────────────────────

  useAppEvents('template-variable-value-updated', () => {
    dashboard?.processRepeats();
  });

  useAppEvents('panel-remove', (_evt: any, options: any) => {
    const { removePanel } = require('app/features/dashboard/utils/panel');
    const panelInfo = dashboard?.getPanelInfoById(options?.panelId);
    if (panelInfo) removePanel(dashboard, panelInfo.panel, true);
  });

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="page-loader-wrapper">
        <i className="page-loader-wrapper__spinner fa fa-spinner fa-spin" />
        <div className="page-loader-wrapper__text">Loading dashboard…</div>
      </div>
    );
  }

  if (!dashboard) return null;

  const submenuEnabled = dashboard.meta.submenuEnabled;

  return (
    <div
      className={classNames({
        'panel-in-fullscreen': isFullscreen,
      })}
    >
      {/* Dashboard top navbar */}
      <DashNav dashboard={dashboard} />

      {/* Scrollable canvas */}
      <PageScrollbar className="scroll-canvas scroll-canvas--dashboard">

        {/* Settings panel (slides in over the grid when ?editview= is set) */}
        {isSettingsOpen && (
          <DashboardSettings dashboard={dashboard} />
        )}

        <div
          className={classNames('dashboard-container', {
            'dashboard-container--has-submenu': submenuEnabled,
          })}
        >
          {/* Template variable / annotation submenu */}
          {submenuEnabled && (
            <DashboardSubmenu dashboard={dashboard} />
          )}

          {/* Panel grid */}
          <DashboardGrid dashboard={dashboard} />
        </div>
      </PageScrollbar>
    </div>
  );
};

export default DashboardPage;
