/**
 * DashboardSettings
 *
 * React port of SettingsCtrl + settings.html.
 * Replaces Angular directive: <dashboard-settings dashboard="...">
 *
 * Renders the settings panel with a sidebar of sections (General, Variables,
 * Links, Versions, Permissions, JSON Model) and the active section's content.
 * Tabs are driven by the ?editview= URL query param, matching Angular behaviour.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import FolderPicker from '../FolderPicker/FolderPicker';
import { Switch } from 'app/core/components/Switch/Switch';
import InfoPopover from 'app/core/components/InfoPopover/InfoPopover';
import { DashboardPermissions } from 'app/features/dashboard/permissions/DashboardPermissions';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useAppEvents, useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardMeta {
  canEdit?: boolean;
  canSave?: boolean;
  canAdmin?: boolean;
  canMakeEditable?: boolean;
  folderId?: number;
  folderTitle?: string;
  folderUrl?: string;
}

interface DashboardModel {
  id: number;
  uid: string;
  title: string;
  description?: string;
  tags: string[];
  editable: boolean;
  graphTooltip: number;
  panels: any[];
  meta: DashboardMeta;
  getSaveModelClone: () => any;
  updateSubmenuVisibility: () => void;
  startRefresh: () => void;
}

export interface DashboardSettingsProps {
  dashboard: DashboardModel;
}

interface Section {
  title: string;
  id: string;
  icon: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Section tab content components (stubs for Angular-owned panels)
// ---------------------------------------------------------------------------

const GeneralTab: React.FC<{ dashboard: DashboardModel; onFolderChange: (f: any) => void }> = ({
  dashboard,
  onFolderChange,
}) => (
  <div className="dashboard-settings__content">
    <h3 className="dashboard-settings__header">General</h3>

    <div className="gf-form-group">
      <div className="gf-form">
        <label className="gf-form-label width-7">Name</label>
        <input
          type="text"
          className="gf-form-input width-30"
          value={dashboard.title}
          onChange={e => { dashboard.title = e.target.value; }}
        />
      </div>
      <div className="gf-form">
        <label className="gf-form-label width-7">Description</label>
        <input
          type="text"
          className="gf-form-input width-30"
          value={dashboard.description || ''}
          onChange={e => { dashboard.description = e.target.value; }}
        />
      </div>
      <div className="gf-form">
        <label className="gf-form-label width-7">
          Tags
          <InfoPopover mode="right-normal">Press enter to add a tag</InfoPopover>
        </label>
        {/* bootstrap-tagsinput still Angular — bridge or migrate separately */}
        <input
          type="text"
          className="gf-form-input width-30"
          placeholder="add tags (comma separated)"
          defaultValue={dashboard.tags?.join(', ')}
          onBlur={e => {
            dashboard.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
          }}
        />
      </div>

      <FolderPicker
        initialTitle={dashboard.meta.folderTitle}
        initialFolderId={dashboard.meta.folderId}
        onChange={onFolderChange}
        enableCreateNew
        labelClass="width-7"
      />

      <Switch
        label="Editable"
        checked={dashboard.editable}
        onChange={() => { dashboard.editable = !dashboard.editable; }}
        labelClass="width-7"
      />
    </div>

    <h5 className="section-heading">Panel Options</h5>
    <div className="gf-form">
      <label className="gf-form-label width-11">
        Graph Tooltip
        <InfoPopover mode="right-normal">
          Cycle between options using Shortcut: CTRL+O or CMD+O
        </InfoPopover>
      </label>
      <div className="gf-form-select-wrapper">
        <select
          className="gf-form-input"
          value={dashboard.graphTooltip}
          onChange={e => { dashboard.graphTooltip = Number(e.target.value); }}
        >
          <option value={0}>Default</option>
          <option value={1}>Shared crosshair</option>
          <option value={2}>Shared Tooltip</option>
        </select>
      </div>
    </div>
  </div>
);

const JsonModelTab: React.FC<{ json: string; canSave: boolean; onSave: (json: string) => void }> = ({
  json,
  canSave,
  onSave,
}) => {
  const [localJson, setLocalJson] = useState(json);
  useEffect(() => setLocalJson(json), [json]);

  return (
    <div className="dashboard-settings__content">
      <h3 className="dashboard-settings__header">JSON Model</h3>
      <div className="dashboard-settings__subheader">
        The JSON Model below is the data structure that defines the dashboard, including settings,
        panel settings & layout, queries etc.
      </div>
      <div className="gf-form">
        <textarea
          className="gf-form-input"
          rows={30}
          value={localJson}
          onChange={e => setLocalJson(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
      {canSave && (
        <div className="gf-form-button-row">
          <button className="btn btn-success" onClick={() => onSave(localJson)}>
            <i className="fa fa-save" /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

const MakeEditableTab: React.FC<{ onMakeEditable: () => void }> = ({ onMakeEditable }) => (
  <div className="dashboard-settings__content">
    <h3 className="dashboard-settings__header">Make Editable</h3>
    <button className="btn btn-success" onClick={onMakeEditable}>Make Editable</button>
  </div>
);

const NotFoundTab: React.FC = () => (
  <div className="dashboard-settings__content">
    <h3 className="dashboard-settings__header">Settings view not found</h3>
    <h5>The settings page could not be found or you do not have permission to access it.</h5>
  </div>
);

// Placeholder for Angular-owned tabs (Variables, Links, Versions)
const AngularTab: React.FC<{ id: string }> = ({ id }) => (
  <div className="dashboard-settings__content">
    <angular-settings-tab data-view={id} />
  </div>
);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'angular-settings-tab': any;
    }
  }
}

// ---------------------------------------------------------------------------
// Main DashboardSettings component
// ---------------------------------------------------------------------------

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ dashboard }) => {
  const history  = useHistory();
  const location = useLocation();

  const dashboardSrv = useAngularService<any>('dashboardSrv');
  const backendSrv   = useAngularService<any>('backendSrv');

  const emitDashScroll = useEmitAppEvent('dash-scroll');

  const [hasUnsavedFolderChange, setHasUnsavedFolderChange] = useState(false);
  const [canSave]   = useState(dashboard.meta.canSave ?? false);
  const [canSaveAs] = useState(true); // contextSrv.hasEditPermissionInFolders
  const [canDelete] = useState(dashboard.meta.canSave ?? false);

  // ── Section list ────────────────────────────────────────────────────────

  const sections = useMemo<Section[]>(() => {
    const list: Section[] = [];
    const params = new URLSearchParams(location.search);
    const basePath = location.pathname;

    const addSection = (s: Omit<Section, 'url'>) => {
      const sectionParams = new URLSearchParams(params);
      sectionParams.set('editview', s.id);
      list.push({ ...s, url: `${config.appSubUrl}${basePath}?${sectionParams}` });
    };

    if (dashboard.meta.canEdit) {
      // Statseeker default dashboards skip the General tab
      if (dashboard.uid.indexOf('StatseekerDefault') !== 0 && !dashboard.meta.canMakeEditable) {
        addSection({ title: 'General',   id: 'settings',   icon: 'gicon gicon-preferences' });
      }
      addSection({ title: 'Variables', id: 'templating', icon: 'gicon gicon-variable' });
      addSection({ title: 'Links',     id: 'links',      icon: 'gicon gicon-link' });
    }
    if (dashboard.id && dashboard.meta.canSave) {
      addSection({ title: 'Versions', id: 'versions', icon: 'fa fa-fw fa-history' });
    }
    if (dashboard.id && dashboard.meta.canAdmin) {
      addSection({ title: 'Permissions', id: 'permissions', icon: 'fa fa-fw fa-lock' });
    }
    if (dashboard.uid.indexOf('StatseekerDefault') !== 0 && dashboard.meta.canMakeEditable) {
      addSection({ title: 'General', id: 'make_editable', icon: 'gicon gicon-preferences' });
    }
    addSection({ title: 'JSON Model', id: 'dashboard_json', icon: 'gicon gicon-json' });

    return list;
  }, [dashboard, location.pathname, location.search]);

  // ── Active view from URL ─────────────────────────────────────────────────

  const viewId = new URLSearchParams(location.search).get('editview') || sections[0]?.id || '';

  // Scroll to top when settings open
  useEffect(() => {
    emitDashScroll({ animate: false, pos: 0 });
  }, [emitDashScroll]);

  // Restore scroll + refresh when settings close
  useEffect(() => {
    return () => {
      dashboard.updateSubmenuVisibility?.();
      setTimeout(() => {
        appEvents.emit('dash-scroll', { restore: true });
        dashboard.startRefresh?.();
      });
    };
  }, [dashboard]);

  // Keep json in sync
  const [json, setJson] = useState('');
  useEffect(() => {
    if (viewId) {
      setJson(JSON.stringify(dashboard.getSaveModelClone(), null, 2));
    }
  }, [viewId, dashboard]);

  // ── Action handlers ──────────────────────────────────────────────────────

  const saveDashboard = useCallback(() => dashboardSrv.saveDashboard(), [dashboardSrv]);

  const openSaveAsModal = useCallback(() => dashboardSrv.showSaveAsModal(), [dashboardSrv]);

  const deleteDashboard = useCallback(() => {
    const alerts = _.sumBy(dashboard.panels, p => (p.alert ? 1 : 0));
    const confirmText = alerts > 0 ? 'DELETE' : '';
    const text2 = alerts > 0
      ? `This dashboard contains ${alerts} alerts. Deleting this dashboard will also delete those alerts`
      : dashboard.title;

    appEvents.emit('confirm-modal', {
      title: 'Delete',
      text: 'Do you want to delete this dashboard?',
      text2,
      icon: 'fa-trash',
      confirmText,
      yesText: 'Delete',
      onConfirm: () => {
        dashboard.meta.canSave = false;
        backendSrv.deleteDashboard(dashboard.uid).then(() => {
          appEvents.emit('alert-success', ['Dashboard Deleted', `${dashboard.title} has been deleted`]);
          history.push('/');
        });
      },
    });
  }, [dashboard, backendSrv, history]);

  const saveJson = useCallback((updatedJson: string) => {
    dashboardSrv.saveJSONDashboard(updatedJson).then(() => {
      window.location.reload();
    });
  }, [dashboardSrv]);

  const makeEditable = useCallback(() => {
    dashboard.editable = true;
    dashboard.meta.canMakeEditable = false;
    dashboard.meta.canEdit = true;
    dashboard.meta.canSave = true;
    const settingsSection = sections.find(s => s.id === 'settings');
    if (settingsSection?.url) history.push(settingsSection.url);
  }, [dashboard, sections, history]);

  const onFolderChange = useCallback((folder: { id: number; title: string }) => {
    dashboard.meta.folderId = folder.id;
    dashboard.meta.folderTitle = folder.title;
    setHasUnsavedFolderChange(true);
  }, [dashboard]);

  // Listen for dashboard-saved to clear unsaved folder change flag
  useAppEvents('dashboard-saved', () => setHasUnsavedFolderChange(false));

  // ── Render active tab content ────────────────────────────────────────────

  const renderContent = () => {
    switch (viewId) {
      case 'settings':
        return <GeneralTab dashboard={dashboard} onFolderChange={onFolderChange} />;

      case 'templating':
      case 'links':
      case 'versions':
        // Still Angular-owned — rendered via angular2react bridge or ng-include
        return <AngularTab id={viewId} />;

      case 'permissions':
        return (
          <div className="dashboard-settings__content">
            {hasUnsavedFolderChange ? (
              <h5>You have changed folder, please save to view permissions.</h5>
            ) : (
              <DashboardPermissions
                dashboardId={dashboard.id}
                folder={{ id: dashboard.meta.folderId, title: dashboard.meta.folderTitle, url: dashboard.meta.folderUrl }}
              />
            )}
          </div>
        );

      case 'dashboard_json':
        return <JsonModelTab json={json} canSave={canSave} onSave={saveJson} />;

      case 'make_editable':
        return <MakeEditableTab onMakeEditable={makeEditable} />;

      case '404':
      default:
        return <NotFoundTab />;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <aside className="dashboard-settings__aside">
        <h2 className="dashboard-settings__aside-header">
          <i className="fa fa-cog" /> Settings
        </h2>

        {sections.map(section => (
          <a
            key={section.id}
            href={section.url}
            className={`dashboard-settings__nav-item ${viewId === section.id ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              if (section.url) history.push(section.url.replace(config.appSubUrl, ''));
            }}
          >
            <i className={section.icon} />
            {section.title}
          </a>
        ))}

        <div className="dashboard-settings__aside-actions">
          {canSave && (
            <button className="btn btn-success" onClick={saveDashboard}>
              <i className="fa fa-save" /> Save
            </button>
          )}
          {canSaveAs && (
            <button className="btn btn-inverse" onClick={openSaveAsModal}>
              <i className="fa fa-copy" /> Save As...
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger" onClick={deleteDashboard}>
              <i className="fa fa-trash" /> Delete
            </button>
          )}
        </div>
      </aside>

      {renderContent()}
    </>
  );
};

export default DashboardSettings;
