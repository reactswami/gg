/**
 * QueryEditorRow
 *
 * React port of QueryRowCtrl + query_editor_row.html.
 * Replaces Angular directive: <query-editor-row query-ctrl="..." can-collapse="...">
 *
 * Wraps a datasource-specific query control (still Angular, via ng-transclude)
 * and provides the collapse/expand/hide/remove/move/duplicate toolbar.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import InfoPopover from 'app/core/components/InfoPopover/InfoPopover';
import QueryTroubleshooter from './QueryTroubleshooter';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import markdownit from 'markdown-it';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QueryEditorRowProps {
  queryCtrl: any;       // datasource-specific query controller
  canCollapse?: boolean;
  children?: React.ReactNode;  // transcluded query editor
}

// ---------------------------------------------------------------------------
// MetricsOptions sub-panel
// ---------------------------------------------------------------------------

interface MetricsOptionsProps {
  panel: any;
  panelCtrl: any;
  queryOptions: any;
}

const MetricsOptions: React.FC<MetricsOptionsProps> = ({ panel, panelCtrl, queryOptions }) => {
  const onChange = () => panelCtrl.refresh();

  return (
    <div>
      {queryOptions?.minInterval && (
        <div className="gf-form gf-form--flex-end">
          <label className="gf-form-label">Min time interval</label>
          <input
            type="text"
            className="gf-form-input width-6"
            placeholder={panelCtrl.interval}
            defaultValue={panel.interval}
            onBlur={e => { panel.interval = e.target.value; onChange(); }}
            spellCheck={false}
          />
          <InfoPopover mode="right-absolute">
            A lower limit for the auto group by time interval. Recommended to be set to write
            frequency, for example <code>1m</code> if your data is written every minute.
          </InfoPopover>
        </div>
      )}
      {queryOptions?.cacheTimeout && (
        <div className="gf-form gf-form--flex-end">
          <label className="gf-form-label width-9">Cache timeout</label>
          <input
            type="text"
            className="gf-form-input width-6"
            placeholder="60"
            defaultValue={panel.cacheTimeout}
            onBlur={e => { panel.cacheTimeout = e.target.value; onChange(); }}
            spellCheck={false}
          />
          <InfoPopover mode="right-absolute">
            If your time series store has a query cache this option can override the default
            cache timeout. Specify a numeric value in seconds.
          </InfoPopover>
        </div>
      )}
      {queryOptions?.maxDataPoints && (
        <div className="gf-form gf-form--flex-end">
          <label className="gf-form-label width-9">Max data points</label>
          <input
            type="text"
            className="gf-form-input width-6"
            placeholder="auto"
            defaultValue={panel.maxDataPoints}
            onBlur={e => { panel.maxDataPoints = e.target.value; onChange(); }}
            spellCheck={false}
          />
          <InfoPopover mode="right-absolute">
            The maximum data points the query should return.
          </InfoPopover>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// QueryEditorRow
// ---------------------------------------------------------------------------

const QueryEditorRow: React.FC<QueryEditorRowProps> = ({ queryCtrl, canCollapse = false, children }) => {
  const backendSrv = useAngularService<any>('backendSrv');

  const panelCtrl = queryCtrl?.panelCtrl;
  const target    = queryCtrl?.target;
  const panel     = panelCtrl?.panel;

  const [collapsed, setCollapsed]                   = useState(false);
  const [collapsedText, setCollapsedText]            = useState('');
  const [optionsOpen, setOptionsOpen]                = useState(false);
  const [helpOpen, setHelpOpen]                      = useState(false);
  const [helpHtml, setHelpHtml]                      = useState('');
  const [troubleshooterOpen, setTroubleshooterOpen]  = useState(false);

  const hasTextEditMode  = typeof queryCtrl?.toggleEditorMode === 'function';
  const queryOptions     = queryCtrl?.datasourceInstance?.meta?.queryOptions;
  const hasQueryHelp     = queryCtrl?.datasourceInstance?.meta?.hasQueryHelp;
  const isSingleStat     = panel?.type === 'singlestat';

  // -- Collapse logic (matches QueryRowCtrl.$onInit) -------------------------

  useEffect(() => {
    if (!canCollapse) return;

    if (!panelCtrl.__collapsedQueryCache) panelCtrl.__collapsedQueryCache = {};
    const cached = panelCtrl.__collapsedQueryCache[target?.refId];
    const initCollapsed = cached !== false;

    if (target?.isNew) {
      delete target.isNew;
      setCollapsed(false);
    } else {
      setCollapsed(panel?.targets?.length >= 4 ? initCollapsed : false);
    }
  }, []);

  const updateCollapsedText = useCallback(() => {
    try {
      setCollapsedText(queryCtrl?.getCollapsedText?.() ?? '');
    } catch (e: any) {
      setCollapsedText('Error: ' + (e.message || e.toString()));
    }
  }, [queryCtrl]);

  const toggleCollapse = useCallback(() => {
    if (!canCollapse) return;
    const next = !collapsed;
    setCollapsed(next);
    if (panelCtrl.__collapsedQueryCache) {
      panelCtrl.__collapsedQueryCache[target?.refId] = next;
    }
    if (next) updateCollapsedText();
  }, [canCollapse, collapsed, panelCtrl, target, updateCollapsedText]);

  // -- Actions ---------------------------------------------------------------

  const toggleHide = useCallback(() => {
    if (target) target.hide = !target.hide;
    panelCtrl?.refresh();
  }, [target, panelCtrl]);

  const removeQuery = useCallback(() => {
    if (panelCtrl?.__collapsedQueryCache) delete panelCtrl.__collapsedQueryCache[target?.refId];
    panelCtrl?.removeQuery(target);
  }, [panelCtrl, target]);

  const duplicateQuery = useCallback(() => {
    const clone = JSON.parse(JSON.stringify(target));
    panelCtrl?.addQuery(clone);
  }, [panelCtrl, target]);

  const moveQuery = useCallback((dir: number) => {
    panelCtrl?.moveQuery(target, dir);
  }, [panelCtrl, target]);

  const toggleEditorMode = useCallback(() => {
    if (canCollapse && collapsed) setCollapsed(false);
    queryCtrl?.toggleEditorMode?.();
  }, [canCollapse, collapsed, queryCtrl]);

  const toggleOptions = useCallback(() => {
    setHelpOpen(false);
    setTroubleshooterOpen(false);
    setOptionsOpen(v => !v);
  }, []);

  const toggleHelp = useCallback(async () => {
    setOptionsOpen(false);
    setTroubleshooterOpen(false);
    const next = !helpOpen;
    setHelpOpen(next);
    if (next && queryCtrl?.datasourceInstance?.meta?.id) {
      try {
        const res = await backendSrv.get(`/api/plugins/${queryCtrl.datasourceInstance.meta.id}/markdown/query_help`);
        const md = new markdownit();
        setHelpHtml(md.render(res));
      } catch { setHelpHtml(''); }
    }
  }, [helpOpen, backendSrv, queryCtrl]);

  const toggleTroubleshooter = useCallback(() => {
    setHelpOpen(false);
    setOptionsOpen(false);
    setTroubleshooterOpen(v => !v);
  }, []);

  // -- Render ----------------------------------------------------------------

  if (!queryCtrl) return null;

  return (
    <div className="gf-form-query">
      {/* -- Header row -------------------------------------------------------- */}
      <div className="gf-form gf-form-query-letter-cell">
        <label className="gf-form-label">
          <a className="pointer" tabIndex={1} onClick={toggleCollapse}>
            <span className={`gf-form-query-letter-cell-carret${!canCollapse ? ' muted' : ''}`}>
              <i className={`fa ${collapsed ? 'fa-caret-right' : 'fa-caret-down'}`} />
            </span>
            <span className="gf-form-query-letter-cell-letter">{target?.refId}</span>
            {target?.datasource && (
              <em className="gf-form-query-letter-cell-ds">({target.datasource})</em>
            )}
          </a>
        </label>
      </div>

      {/* Collapsed text */}
      {collapsed && (
        <div className="gf-form-query-content gf-form-query-content--collapsed">
          <div className="gf-form">
            <label className="gf-form-label pointer gf-form-label--grow" onClick={toggleCollapse}>
              {collapsedText}
            </label>
          </div>
        </div>
      )}

      {/* Query editor slot (transcluded Angular content) */}
      {!collapsed && (
        <div className="gf-form-query-content">
          {children}
        </div>
      )}

      {/* Actions menu */}
      <div className="gf-form">
        <label className="gf-form-label dropdown">
          <a className="pointer dropdown-toggle" data-toggle="dropdown" tabIndex={1}>
            <i className="fa fa-bars" />
          </a>
          <ul className="dropdown-menu pull-right" role="menu">
            {hasTextEditMode && (
              <li role="menuitem"><a tabIndex={1} onClick={toggleEditorMode}>Toggle Edit Mode</a></li>
            )}
            {!isSingleStat && (
              <>
                <li role="menuitem"><a tabIndex={1} onClick={duplicateQuery}>Duplicate</a></li>
                <li role="menuitem"><a tabIndex={1} onClick={() => moveQuery(-1)}>Move up</a></li>
                <li role="menuitem"><a tabIndex={1} onClick={() => moveQuery(1)}>Move down</a></li>
              </>
            )}
          </ul>
        </label>
        <label className="gf-form-label">
          <a onClick={toggleHide} role="menuitem"><i className="fa fa-eye" /></a>
        </label>
        {!isSingleStat && (
          <label className="gf-form-label">
            <a className="pointer" tabIndex={1} onClick={removeQuery}><i className="fa fa-trash" /></a>
          </label>
        )}
      </div>

      {/* -- Options / Help / Troubleshooter footer ---------------------------- */}
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow" />
        {queryOptions && (
          <div className="gf-form">
            <a className="gf-form-label" onClick={toggleOptions}>
              <i className={`fa fa-fw ${optionsOpen ? 'fa-caret-down' : 'fa-caret-right'}`} /> Options
            </a>
          </div>
        )}
        {hasQueryHelp && (
          <div className="gf-form">
            <button className="gf-form-label" onClick={toggleHelp}>
              <i className={`fa fa-fw ${helpOpen ? 'fa-caret-down' : 'fa-caret-right'}`} /> Help
            </button>
          </div>
        )}
        <div className="gf-form">
          <button className="gf-form-label" onClick={toggleTroubleshooter} title="Display query request & response">
            <i className={`fa fa-fw ${troubleshooterOpen ? 'fa-caret-down' : 'fa-caret-right'}`} /> Query Inspector
          </button>
        </div>
      </div>

      <div>
        {optionsOpen && panel && panelCtrl && (
          <MetricsOptions panel={panel} panelCtrl={panelCtrl} queryOptions={queryOptions} />
        )}

        {helpOpen && (
          <div className="grafana-info-box">
            <div className="markdown-html" dangerouslySetInnerHTML={{ __html: helpHtml }} />
            <a className="grafana-info-box__close" onClick={toggleHelp}>
              <i className="fa fa-chevron-up" />
            </a>
          </div>
        )}

        <QueryTroubleshooter panelCtrl={panelCtrl} isOpen={troubleshooterOpen} />
      </div>
    </div>
  );
};

export default QueryEditorRow;
