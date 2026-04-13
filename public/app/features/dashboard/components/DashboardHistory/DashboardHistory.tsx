/**
 * DashboardHistory
 *
 * React port of HistoryListCtrl + history.html.
 * Replaces Angular directive: <gf-dashboard-history dashboard="...">
 *
 * Used inside DashboardSettings Versions tab.
 */

import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import _ from 'lodash';
import { Switch } from 'app/core/components/Switch/Switch';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useAppEvents } from 'app/core/hooks/useAppEvents';
import appEvents from 'app/core/app_events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Revision {
  id: number;
  version: number;
  parentVersion: number;
  dashboardId: number;
  createdBy: string;
  created: string;
  message: string;
  createdDateString?: string;
  ageString?: string;
  checked: boolean;
}

interface DashboardModel {
  id: number;
  version: number;
  timezone: string;
  formatDate: (date: string) => string;
}

export interface DashboardHistoryProps {
  dashboard: DashboardModel;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LIMIT = 10;

const DashboardHistory: React.FC<DashboardHistoryProps> = ({ dashboard }) => {
  const historySrv = useAngularService<any>('historySrv');

  const [mode, setMode]             = useState<'list' | 'compare'>('list');
  const [revisions, setRevisions]   = useState<Revision[]>([]);
  const [loading, setLoading]       = useState(false);
  const [appending, setAppending]   = useState(false);
  const [start, setStart]           = useState(0);
  const [canCompare, setCanCompare] = useState(false);
  const [delta, setDelta]           = useState<{ basic: string; json: string }>({ basic: '', json: '' });
  const [diff, setDiff]             = useState<'basic' | 'json'>('basic');
  const [newInfo, setNewInfo]       = useState<Revision | null>(null);
  const [baseInfo, setBaseInfo]     = useState<Revision | null>(null);
  const [isNewLatest, setIsNewLatest] = useState(false);

  // -- Helpers ---------------------------------------------------------------

  const formatDate = useCallback((date: string) => dashboard.formatDate(date), [dashboard]);

  const formatBasicDate = useCallback((date: string) => {
    const now = dashboard.timezone === 'browser' ? moment() : moment.utc();
    const then = dashboard.timezone === 'browser' ? moment(date) : moment.utc(date);
    return then.from(now);
  }, [dashboard]);

  // -- Load history ----------------------------------------------------------

  const getLog = useCallback(async (append = false, startOffset = 0) => {
    if (append) setAppending(true);
    else setLoading(true);

    try {
      const fetched: Revision[] = await historySrv.getHistoryList(dashboard, {
        limit: LIMIT,
        start: startOffset,
      });

      const processed = fetched.map(rev => ({
        ...rev,
        createdDateString: formatDate(rev.created),
        ageString: formatBasicDate(rev.created),
        checked: false,
      }));

      setRevisions(prev => append ? [...prev, ...processed] : processed);
    } finally {
      setLoading(false);
      setAppending(false);
    }
  }, [historySrv, dashboard, formatDate, formatBasicDate]);

  useEffect(() => { getLog(false, 0); }, []);

  // Reload when dashboard is saved
  useAppEvents('dashboard-saved', () => {
    setMode('list');
    setStart(0);
    setDelta({ basic: '', json: '' });
    getLog(false, 0);
  });

  // -- Selection -------------------------------------------------------------

  const handleRevisionToggle = useCallback((rev: Revision) => {
    const updated = revisions.map(r => r.id === rev.id ? { ...r, checked: !r.checked } : r);
    setRevisions(updated);
    const selectedCount = updated.filter(r => r.checked).length;
    setCanCompare(selectedCount === 2);
  }, [revisions]);

  // -- Compare ---------------------------------------------------------------

  const getDiff = useCallback(async (diffType: 'basic' | 'json') => {
    setDiff(diffType);
    setMode('compare');

    // Use cached if available
    if (delta[diffType]) return;

    const selected = revisions.filter(r => r.checked);
    const n = selected[0];
    const b = selected[1];

    setNewInfo(n);
    setBaseInfo(b);
    setIsNewLatest(n.version === dashboard.version);
    setLoading(true);

    try {
      const response = await historySrv.calculateDiff({
        new: { dashboardId: dashboard.id, version: n.version },
        base: { dashboardId: dashboard.id, version: b.version },
        diffType,
      });
      setDelta(prev => ({ ...prev, [diffType]: response }));
    } catch {
      setMode('list');
    } finally {
      setLoading(false);
    }
  }, [delta, revisions, dashboard, historySrv]);

  // -- Restore ---------------------------------------------------------------

  const restore = useCallback((version: number) => {
    appEvents.emit('confirm-modal', {
      title: 'Restore version',
      text: `Are you sure you want to restore the dashboard to version ${version}? All unsaved changes will be lost.`,
      icon: 'fa-history',
      yesText: 'Yes, restore',
      onConfirm: async () => {
        await historySrv.restoreDashboard(dashboard, version);
        window.location.reload();
      },
    });
  }, [historySrv, dashboard]);

  // -- Load more -------------------------------------------------------------

  const addToLog = useCallback(() => {
    const newStart = start + LIMIT;
    setStart(newStart);
    getLog(true, newStart);
  }, [start, getLog]);

  const isLastPage = revisions.some(r => r.version === 1);

  // -- Render ----------------------------------------------------------------

  return (
    <div>
      <h3 className="dashboard-settings__header">
        <a onClick={() => { setMode('list'); setDelta({ basic: '', json: '' }); setCanCompare(false); }}>
          Versions
        </a>
        {mode === 'compare' && newInfo && baseInfo && (
          <span>
            {' > Comparing '}{baseInfo.version}
            <i className="fa fa-arrows-h" />
            {newInfo.version}
            {isNewLatest && <cite className="muted"> (Latest)</cite>}
          </span>
        )}
      </h3>

      {/* -- List mode -------------------------------------------------------- */}
      {mode === 'list' && (
        <div>
          {loading && <div><i className="fa fa-spinner fa-spin" /> <em>Fetching history list-</em></div>}

          {!loading && (
            <div className="gf-form-group">
              <table className="filter-table">
                <thead>
                  <tr>
                    <th className="width-4" />
                    <th className="width-4">Version</th>
                    <th className="width-14">Date</th>
                    <th className="width-10">Updated By</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {revisions.map(rev => (
                    <tr key={rev.id}>
                      <td className="filter-table__switch-cell">
                        <Switch
                          label=""
                          checked={rev.checked}
                          onChange={() => handleRevisionToggle(rev)}
                          switchClass="gf-form-switch--table-cell"
                        />
                      </td>
                      <td className="text-center">{rev.version}</td>
                      <td>{rev.createdDateString}</td>
                      <td>{rev.createdBy}</td>
                      <td>{rev.message}</td>
                      <td className="text-right">
                        {rev.version !== dashboard.version ? (
                          <a className="btn btn-inverse btn-small" onClick={() => restore(rev.version)}>
                            <i className="fa fa-history" />&nbsp;&nbsp;Restore
                          </a>
                        ) : (
                          <a className="btn btn-outline-disabled btn-small">
                            <i className="fa fa-check" />&nbsp;&nbsp;Latest
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {appending && <div><i className="fa fa-spinner fa-spin" /> <em>Fetching more entries-</em></div>}

              <div className="gf-form-group">
                <div className="gf-form-button-row">
                  <button
                    type="button"
                    className="btn gf-form-button btn-inverse"
                    disabled={!canCompare}
                    onClick={() => getDiff('basic')}
                  >
                    <i className="fa fa-exchange" /> Compare versions
                  </button>
                  {!isLastPage && (
                    <button
                      type="button"
                      className="btn gf-form-button btn-link"
                      onClick={addToLog}
                    >
                      Show more versions
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- Compare mode ----------------------------------------------------- */}
      {mode === 'compare' && (
        <div>
          {loading && <div><i className="fa fa-spinner fa-spin" /> <em>Calculating diff-</em></div>}

          {!loading && delta[diff] && (
            <>
              <div className="gf-form-button-row">
                <button
                  className={`btn btn-small ${diff === 'basic' ? 'btn-inverse' : 'btn-link'}`}
                  onClick={() => getDiff('basic')}
                >
                  Basic
                </button>
                <button
                  className={`btn btn-small ${diff === 'json' ? 'btn-inverse' : 'btn-link'}`}
                  onClick={() => getDiff('json')}
                >
                  JSON
                </button>
              </div>
              <div
                className="delta-html"
                dangerouslySetInnerHTML={{ __html: delta[diff] }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHistory;
