/**
 * DashNav
 *
 * React port of DashNavCtrl + dashnav.html.
 * Replaces Angular directive: <dashnav dashboard="ctrl.dashboard">
 *
 * Props mirror the Angular bindings - dashboard is the DashboardModel.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import classNames from 'classnames';
import moment from 'moment';
import { sanitizeUrl } from 'app/core/utils/text';
import { useAppEvents, useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import { useAngularService } from 'app/core/hooks/useAngularService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardMeta {
  canSave?: boolean;
  canStar?: boolean;
  canShare?: boolean;
  canSearch?: boolean;
  canAddDashboard?: boolean;
  canAddFolder?: boolean;
  canImportDashboard?: boolean;
  showSettings?: boolean;
  showViewMode?: boolean;
  isStarred?: boolean;
  isSnapshot?: boolean;
  isHome?: boolean;
  folderId?: number;
  folderTitle?: string;
  created?: string;
  expires?: string;
}

interface DashboardModel {
  id: number;
  title: string;
  meta: DashboardMeta;
  panels: any[];
  timepicker: { hidden?: boolean };
  snapshot?: { originalUrl?: string };
  annotations: { list: any[] };
  links: any[];
  addPanel: (panel: any) => void;
}

export interface DashNavProps {
  dashboard: DashboardModel;
}

// ---------------------------------------------------------------------------
// DashNav
// ---------------------------------------------------------------------------

const DashNav: React.FC<DashNavProps> = ({ dashboard }) => {
  const dashboardSrv  = useAngularService<any>('dashboardSrv');
  const playlistSrv   = useAngularService<any>('playlistSrv');

  const emitShowSearch   = useEmitAppEvent('show-dash-search');
  const emitToggleKiosk  = useEmitAppEvent('toggle-kiosk-mode');
  const emitDashScroll   = useEmitAppEvent('dash-scroll');

  const [isStarred, setIsStarred] = useState(dashboard.meta.isStarred ?? false);
  const [isPlaylistPlaying, setIsPlaylistPlaying] = useState(playlistSrv?.isPlaying ?? false);
  const [titleTooltip, setTitleTooltip] = useState('');
  const [urlTitle, setUrlTitle] = useState('');

  // -- On mount: parse URL title param + snapshot tooltip ------------------

  useEffect(() => {
    // Parse ?title= from URL
    const params = new URLSearchParams(window.location.search);
    let title = params.get('title') || '';
    if (title) {
      const dollarIdx = title.indexOf('$');
      if (dollarIdx !== -1) {
        const variable = title.substring(dollarIdx + 1).split(' ')[0];
        const varVal = params.get('var-' + variable);
        if (varVal) {
          title = title.replace('$' + variable, decodeURIComponent(varVal));
        }
      }
      setUrlTitle(decodeURIComponent(title));
    }

    // Snapshot tooltip
    if (dashboard.meta.isSnapshot) {
      const meta = dashboard.meta;
      let tooltip = 'Created: &nbsp;' + moment(meta.created).calendar();
      if (meta.expires) {
        tooltip += '<br>Expires: &nbsp;' + moment(meta.expires).fromNow() + '<br>';
      }
      setTitleTooltip(tooltip);
    }
  }, [dashboard]);

  // Keep playlist playing state in sync
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaylistPlaying(playlistSrv?.isPlaying ?? false);
    }, 500);
    return () => clearInterval(interval);
  }, [playlistSrv]);

  // Listen for save-dashboard event
  useAppEvents('save-dashboard', () => {
    dashboardSrv.saveDashboard();
  });

  // -- Handlers -------------------------------------------------------------

  const showSearch = useCallback((folderId?: number) => {
    emitShowSearch({ folderId });
  }, [emitShowSearch]);

  const toggleSettings = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('editview')) {
      params.delete('editview');
    } else {
      params.set('editview', 'settings');
    }
    window.history.pushState({}, '', '?' + params.toString());
  }, []);

  const toggleViewMode = useCallback(() => {
    emitToggleKiosk();
  }, [emitToggleKiosk]);

  const close = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('editview')) {
      params.delete('editview');
    } else if (params.has('fullscreen')) {
      ['fullscreen', 'edit', 'tab', 'panelId'].forEach(k => params.delete(k));
    }
    window.history.pushState({}, '', '?' + params.toString());
  }, []);

  const starDashboard = useCallback(async () => {
    const newState = await dashboardSrv.starDashboard(
      dashboard.id,
      dashboard.meta.isStarred
    );
    dashboard.meta.isStarred = newState;
    setIsStarred(newState);
  }, [dashboardSrv, dashboard]);

  const shareDashboard = useCallback(() => {
    // Still uses Angular appEvents modal - will be migrated with modal system
    const event = new CustomEvent('show-modal', {
      detail: {
        src: 'public/app/features/dashboard/partials/shareModal.html',
        dashboard,
      },
    });
    window.dispatchEvent(event);
  }, [dashboard]);

  const saveDashboard = useCallback(() => {
    dashboardSrv.saveDashboard();
  }, [dashboardSrv]);

  const addPanel = useCallback(() => {
    emitDashScroll({ animate: true, evt: 0 });
    if (dashboard.panels.length > 0 && dashboard.panels[0].type === 'add-panel') {
      return;
    }
    dashboard.addPanel({
      type: 'add-panel',
      gridPos: { x: 0, y: 0, w: 12, h: 9 },
      title: 'Panel Title',
    });
  }, [dashboard, emitDashScroll]);

  // -- Render ----------------------------------------------------------------

  const meta = dashboard.meta;
  const displayTitle = urlTitle || dashboard.title;
  const folderId = meta.folderId;

  return (
    <div className="navbar">
      {/* -- Title / breadcrumb area ----------------------------------------- */}
      {meta.canSearch ? (
        <a className="navbar-page-btn">
          <span
            onClick={() => showSearch()}
            title="Open dashboard list"
          >
            <i className="fa fa-search" />
          </span>

          {meta.isHome && (
            <span
              className="navbar-page-btn--title navbar-search-hint"
              onClick={() => showSearch(folderId)}
            >
              Search Dashboards
            </span>
          )}

          {folderId != null && folderId > 0 && (
            <span
              className="navbar-page-btn--folder"
              title={meta.folderTitle}
              onClick={() => showSearch(folderId)}
            >
              {meta.folderTitle}
            </span>
          )}

          {folderId === 0 && displayTitle.trim().length > 0 && (
            <span
              className="navbar-page-btn--folder"
              onClick={() => showSearch(0)}
            >
              General
            </span>
          )}

          {folderId != null && folderId >= 0 && displayTitle.trim().length > 0 && (
            <span className="navbar-page-btn--sep">/</span>
          )}

          <span
            className="navbar-page-btn--title"
            title={displayTitle.trim()}
            onClick={() => showSearch(folderId)}
          >
            {displayTitle}
          </span>
        </a>
      ) : (
        <div className="navbar-page-btn no-search">
          {folderId != null && folderId > 0 && (
            <span className="navbar-page-btn--folder">{meta.folderTitle}</span>
          )}
          {folderId === 0 && displayTitle.trim().length > 0 && (
            <span className="navbar-page-btn--folder">General</span>
          )}
          {folderId != null && folderId >= 0 && displayTitle.trim().length > 0 && (
            <span className="navbar-page-btn--sep">/</span>
          )}
          <span>{displayTitle}</span>
        </div>
      )}

      {/* -- Button panel --------------------------------------------------- */}
      <div className="navbar-btn-panel">

        {/* Playlist controls */}
        {isPlaylistPlaying && (
          <div className="navbar-buttons navbar-buttons--playlist">
            <a className="navbar-button navbar-button--tight" onClick={() => playlistSrv.prev()}>
              <i className="fa fa-step-backward" />
            </a>
            <a className="navbar-button navbar-button--tight" onClick={() => playlistSrv.stop()}>
              <i className="fa fa-stop" />
            </a>
            <a className="navbar-button navbar-button--tight" onClick={() => playlistSrv.next()}>
              <i className="fa fa-step-forward" />
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="navbar-buttons navbar-buttons--actions">
          {meta.canAddDashboard && (
            <a className="btn navbar-button navbar-button--add-dashboard" title="Add dashboard" href="dashboard/new">
              <i className="gicon gicon-dashboard-new" />
            </a>
          )}
          {meta.canAddFolder && (
            <a className="btn navbar-button navbar-button--add-folder" title="Add folder" href="dashboards/folder/new">
              <i className="gicon gicon-folder-new" />
            </a>
          )}
          {meta.canImportDashboard && (
            <>
              <a className="btn navbar-button navbar-button--import-dashboard" title="Import dashboard" href="dashboard/import">
                <i className="gicon gicon-dashboard-import" />
              </a>
              <a className="btn navbar-button navbar-button--import-dashboard" title="Import template" href="template/import">
                <i className="gicon gicon-import-template" />
              </a>
            </>
          )}
          {meta.canSave && (
            <button className="btn navbar-button navbar-button--add-panel" title="Add panel" onClick={addPanel}>
              <i className="gicon gicon-add-panel" />
            </button>
          )}
          {meta.canStar && (
            <button className="btn navbar-button navbar-button--star" title="Mark as favorite" onClick={starDashboard}>
              <i className={classNames('fa', { 'fa-star-o': !isStarred, 'fa-star': isStarred })} />
            </button>
          )}
          {meta.canShare && (
            <button className="btn navbar-button navbar-button--share" title="Share dashboard" onClick={shareDashboard}>
              <i className="fa fa-share-square-o" />
            </button>
          )}
          {meta.canSave && (
            <button className="btn navbar-button navbar-button--save" title="Save dashboard (CTRL+S)" onClick={saveDashboard}>
              <i className="fa fa-save" />
            </button>
          )}
          {dashboard.snapshot?.originalUrl && (
            <a
              className="btn navbar-button navbar-button--snapshot-origin"
              href={sanitizeUrl(dashboard.snapshot.originalUrl)}
              title="Open original dashboard"
            >
              <i className="fa fa-link" />
            </a>
          )}
          {meta.showSettings && (
            <button className="btn navbar-button navbar-button--settings" title="Settings" onClick={toggleSettings}>
              <i className="fa fa-cog" />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        {meta.showViewMode && (
          <div className="navbar-buttons navbar-buttons--tv">
            <button className="btn navbar-button navbar-button--tv" title="Cycle view mode" onClick={toggleViewMode}>
              <i className="fa fa-desktop" />
            </button>
          </div>
        )}

        {/* Time picker - still Angular, bridge-wrapped */}
        {!dashboard.timepicker.hidden && (
          <gf-time-picker-wrapper dashboard={dashboard} />
        )}

        {/* Close button */}
        <div className="navbar-buttons navbar-buttons--close">
          <button className="btn navbar-button navbar-button--primary" title="Back to dashboard" onClick={close}>
            <i className="fa fa-reply" />
          </button>
        </div>
      </div>

      {/* Search panel - self-contained, renders via appEvents */}
      <search-panel-anchor />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Thin stubs for Angular children not yet migrated
// Keep TypeScript happy while these remain as Angular directives
// ---------------------------------------------------------------------------

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gf-time-picker-wrapper': any;
      'search-panel-anchor': any;
    }
  }
}

export default DashNav;
