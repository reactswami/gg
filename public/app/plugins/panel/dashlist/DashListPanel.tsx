/**
 * DashListPanel (React)
 *
 * React replacement for DashListCtrl + module.html.
 * Fetches starred, recently viewed, and search dashboards via backendSrv
 * and renders them as collapsible link groups.
 *
 * Mirrors DashListCtrl behaviour exactly:
 *   - hiddenFilter regex strips StatseekerDefault drilldown dashboards
 *   - dashboard_data.hidden_dashboards list applied on top
 *   - impressionSrv provides recently-viewed order (preserves access order)
 *   - Star/unstar calls dashboardSrv.starDashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import { PanelProps } from 'app/types';
import { getBackendSrv } from 'app/core/services/backend_srv';
import impressionSrv from 'app/core/services/impression_srv';
import { getDashboardSrv } from 'app/features/dashboard/dashboard_srv';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashListOptions {
  query: string;
  limit: number;
  tags: string[];
  recent: boolean;
  search: boolean;
  starred: boolean;
  headings: boolean;
  folderId: number | null;
}

interface DashItem {
  id: number;
  uid: string;
  title: string;
  url: string;
  type: string;
  isStarred: boolean;
}

interface DashGroup {
  header: string;
  list: DashItem[];
  show: boolean;
}

declare const dashboard_data: any;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HIDDEN_FILTER = /hidden|^StatseekerDefaultDrilldown.*$/i;

function filterOutHidden(items: DashItem[]): DashItem[] {
  const hiddenList: string[] = (() => {
    try { return dashboard_data?.hidden_dashboards ?? []; } catch { return []; }
  })();

  return items.filter(
    item => item && !item.uid?.match(HIDDEN_FILTER) && !hiddenList.includes(item.uid)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props extends PanelProps<DashListOptions> {}

export const DashListPanel: React.FC<Props> = ({ options, panel, refreshCounter }) => {
  const opts: DashListOptions = {
    query: '',
    limit: 10,
    tags: [],
    recent: false,
    search: false,
    starred: true,
    headings: true,
    folderId: null,
    ...(options ?? panel?.options ?? {}),
  };

  const [groups, setGroups] = useState<DashGroup[]>([
    { header: 'Starred dashboards',         list: [], show: false },
    { header: 'Recently viewed dashboards', list: [], show: false },
    { header: 'Search',                     list: [], show: false },
  ]);

  // -- Data fetching ---------------------------------------------------------

  const fetchAll = useCallback(async () => {
    const backendSrv = getBackendSrv();

    const [starred, recent, search] = await Promise.all([
      // Starred
      opts.starred
        ? backendSrv.search({ limit: opts.limit, starred: 'true' }).then(filterOutHidden)
        : Promise.resolve([]),

      // Recently viewed (preserves impression order)
      opts.recent
        ? (() => {
            const ids = _.take(impressionSrv.getDashboardOpened(), opts.limit);
            return backendSrv
              .search({ dashboardIds: ids, limit: opts.limit })
              .then((result: DashItem[]) =>
                ids
                  .map(id => result.find(d => d.id === id))
                  .filter((d): d is DashItem => d !== undefined && d.type === 'dash-db')
              )
              .then(filterOutHidden);
          })()
        : Promise.resolve([]),

      // Search
      opts.search
        ? backendSrv
            .search({
              limit: opts.limit,
              query: opts.query,
              tag: opts.tags,
              folderIds: opts.folderId,
              type: 'dash-db',
            })
            .then(filterOutHidden)
        : Promise.resolve([]),
    ]);

    setGroups([
      { header: 'Starred dashboards',         list: starred, show: opts.starred },
      { header: 'Recently viewed dashboards', list: recent,  show: opts.recent  },
      { header: 'Search',                     list: search,  show: opts.search  },
    ]);
  }, [
    opts.starred, opts.recent, opts.search,
    opts.limit, opts.query,
    JSON.stringify(opts.tags), opts.folderId,
  ]);

  // Refetch on mount and whenever panel refreshes
  useEffect(() => { fetchAll(); }, [fetchAll, refreshCounter]);

  // -- Star/unstar -----------------------------------------------------------

  const handleStar = useCallback(async (dash: DashItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const dashboardSrv = getDashboardSrv();
    const newState = await dashboardSrv.starDashboard(dash.id, dash.isStarred);
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        list: g.list.map(d => d.id === dash.id ? { ...d, isStarred: newState } : d),
      }))
    );
  }, []);

  // -- Render ----------------------------------------------------------------

  return (
    <div className="dashlist">
      {groups.map(group =>
        group.show ? (
          <div key={group.header} className="dashlist-section">
            {opts.headings && (
              <h6 className="dashlist-section-header">{group.header}</h6>
            )}
            {group.list.map(dash => (
              <div key={dash.uid} className="dashlist-item">
                <a
                  className={`dashlist-link dashlist-link-${dash.type}`}
                  href={dash.url}
                >
                  <span className="dashlist-title">{dash.title}</span>
                  <span
                    className="dashlist-star"
                    onClick={e => handleStar(dash, e)}
                  >
                    <i className={`fa ${dash.isStarred ? 'fa-star' : 'fa-star-o'}`} />
                  </span>
                </a>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
};

export { DashListPanel as PanelComponent };
