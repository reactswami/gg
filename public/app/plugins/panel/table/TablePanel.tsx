/**
 * TablePanel (React)
 *
 * React replacement for TablePanelCtrl + module.html.
 *
 * TableRenderer and transformers.ts are pure TypeScript with zero Angular
 * coupling - they are reused unchanged. Only the render layer (jQuery DOM
 * manipulation + $sanitize + pagination) moves to React.
 *
 * Export name PanelComponent is required by DashboardPanel/PanelChrome.
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { PanelProps, TimeSeries } from 'app/types';
import { TableRenderer } from './renderer';
import { transformDataToTable } from './transformers';
import TableModel from 'app/core/table_model';
import { getTemplateSrv } from 'app/features/templating/template_srv';
import { getLinkSrv } from 'app/features/dashboard/panellinks/link_srv';
import { getSanitize } from 'app/core/utils/sanitize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TableStyle {
  pattern: string;
  type: string;
  alias?: string;
  unit?: string;
  decimals?: number;
  dateFormat?: string;
  thresholds?: any[];
  colorMode?: string;
  colors?: string[];
  link?: boolean;
  linkUrl?: string;
  linkTooltip?: string;
  linkTargetBlank?: boolean;
}

interface TableOptions {
  transform: string;
  pageSize: number | null;
  showHeader: boolean;
  styles: TableStyle[];
  columns: any[];
  scroll: boolean;
  fontSize: string;
  sort: { col: number; desc: boolean };
}

interface Props extends PanelProps<TableOptions> {
  timeSeries: TimeSeries[];
  panel: any;
  dashboard: any;
}

// ---------------------------------------------------------------------------
// Default options
// ---------------------------------------------------------------------------

const PANEL_DEFAULTS: TableOptions = {
  transform: 'timeseries_to_columns',
  pageSize: null,
  showHeader: true,
  styles: [
    { type: 'date', pattern: 'Time', alias: 'Time', dateFormat: 'YYYY-MM-DD HH:mm:ss' },
    { unit: 'short', type: 'number', alias: '', decimals: 2, pattern: '/.*/', thresholds: [] },
  ],
  columns: [],
  scroll: true,
  fontSize: '100%',
  sort: { col: 0, desc: true },
};

const FONT_SIZES = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TablePanel: React.FC<Props> = ({ options, panel, dashboard, timeSeries }) => {
  const opts = { ...PANEL_DEFAULTS, ...(options ?? panel?.options ?? {}) };

  const [pageIndex, setPageIndex] = useState(0);
  const [sort, setSort] = useState(opts.sort ?? { col: 0, desc: true });

  // Reset page when data changes
  useEffect(() => setPageIndex(0), [timeSeries]);

  // -- Build table model from time series data -------------------------------

  const tableModel = useMemo<TableModel | null>(() => {
    if (!timeSeries?.length) return null;
    const model = new TableModel();
    transformDataToTable(timeSeries, opts, model);
    model.sort(sort);
    return model;
  }, [timeSeries, opts.transform, opts.columns, sort]);

  // -- Build renderer --------------------------------------------------------

  const renderer = useMemo(() => {
    if (!tableModel) return null;
    const isUtc = dashboard?.timezone === 'utc';
    return new TableRenderer(
      opts,
      tableModel,
      isUtc,
      getSanitize(),
      getTemplateSrv(),
      getLinkSrv()
    );
  }, [tableModel, opts, dashboard]);

  // -- Pagination ------------------------------------------------------------

  const pageSize = opts.pageSize || 100;
  const totalRows = tableModel?.rows?.length ?? 0;
  const pageCount = Math.ceil(totalRows / pageSize);

  const pagedRows = useMemo(() => {
    if (!tableModel) return [];
    if (!opts.pageSize) return tableModel.rows;
    return tableModel.rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }, [tableModel, pageIndex, pageSize, opts.pageSize]);

  // -- Sort handler ----------------------------------------------------------

  const handleSort = useCallback((colIndex: number) => {
    setSort(prev => ({
      col: colIndex,
      desc: prev.col === colIndex ? !prev.desc : true,
    }));
    setPageIndex(0);
  }, []);

  // -- Column style for a given row/col -------------------------------------

  const getCellHtml = useCallback((rowIndex: number, colIndex: number, value: any): string => {
    if (!renderer) return String(value ?? '');
    try {
      return renderer.renderCell(rowIndex, colIndex, value, true);
    } catch {
      return String(value ?? '');
    }
  }, [renderer]);

  // -- Render ----------------------------------------------------------------

  if (!tableModel || !renderer) {
    return (
      <div className="datapoints-warning">
        <span className="small">No data points</span>
      </div>
    );
  }

  return (
    <div
      className="table-panel-container"
      style={{ fontSize: opts.fontSize }}
    >
      <div
        className="table-panel-scroll"
        style={{ maxHeight: opts.scroll ? undefined : undefined }}
      >
        <table className="table-panel-table">
          {opts.showHeader && (
            <thead>
              <tr>
                {tableModel.columns.map((col: any, colIndex: number) => (
                  <th
                    key={colIndex}
                    className={`muted pointer ${sort.col === colIndex ? (sort.desc ? 'sort-desc' : 'sort-asc') : ''}`}
                    onClick={() => handleSort(colIndex)}
                  >
                    {col.title || col.text}
                    {sort.col === colIndex && (
                      <span className={`fa fa-caret-${sort.desc ? 'down' : 'up'}`} style={{ marginLeft: 4 }} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {pagedRows.map((row: any[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row.map((cell: any, colIndex: number) => (
                  <td
                    key={colIndex}
                    dangerouslySetInnerHTML={{
                      __html: getCellHtml(pageIndex * pageSize + rowIndex, colIndex, cell),
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="table-panel-footer" style={{ fontSize: opts.fontSize }}>
          <ul className="pagination pagination-sm">
            {Array.from({ length: Math.min(pageCount, 9) }, (_, i) => {
              const startPage = Math.max(pageIndex - 4, 0);
              const page = startPage + i;
              if (page >= pageCount) return null;
              return (
                <li key={page} className={page === pageIndex ? 'active' : ''}>
                  <a
                    className="table-panel-page-link pointer"
                    onClick={() => setPageIndex(page)}
                  >
                    {page + 1}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export { TablePanel as PanelComponent };
