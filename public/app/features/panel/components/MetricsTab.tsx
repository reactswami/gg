/**
 * MetricsTab
 *
 * React port of MetricsTabCtrl + metrics_tab.html.
 * Replaces Angular directive: <metrics-tab> (scope: true, inherits panelCtrl from scope)
 *
 * Note: The individual query editor rows (<plugin-component type="query-ctrl">)
 * are still Angular — they are transcluded through rebuild-on-change which wraps
 * the datasource-specific Angular query controller. These remain as Angular until
 * each datasource plugin is migrated.
 *
 * This component provides the datasource selector, Add Query button, and the
 * Options/Help/Query Inspector footer row — all of which are now React.
 */

import React, { useState, useCallback, useEffect } from 'react';
import FormDropdown from 'app/core/components/FormDropdown/FormDropdown';
import InfoPopover from 'app/core/components/InfoPopover/InfoPopover';
import QueryTroubleshooter from './QueryTroubleshooter';
import { useAngularService } from 'app/core/hooks/useAngularService';
import markdownit from 'markdown-it';
import _ from 'lodash';
import config from 'app/core/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DatasourceInfo {
  value: string | null;
  name: string;
  meta: {
    id: string;
    mixed?: boolean;
    builtIn?: boolean;
    hasQueryHelp?: boolean;
    queryOptions?: { minInterval?: boolean; cacheTimeout?: boolean; maxDataPoints?: boolean };
  };
  datasource?: any;
}

export interface MetricsTabProps {
  panelCtrl: any;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MetricsTab: React.FC<MetricsTabProps> = ({ panelCtrl }) => {
  const datasourceSrv = useAngularService<any>('datasourceSrv');
  const backendSrv    = useAngularService<any>('backendSrv');

  const panel     = panelCtrl?.panel;
  const dashboard = panelCtrl?.dashboard;

  const [datasources]   = useState<DatasourceInfo[]>(() => datasourceSrv.getMetricSources());
  const [currentDs, setCurrentDs] = useState<DatasourceInfo | null>(() => {
    return datasources.find(ds => ds.value === panel?.datasource) || null;
  });

  const [optionsOpen, setOptionsOpen]         = useState(false);
  const [helpOpen, setHelpOpen]               = useState(false);
  const [helpHtml, setHelpHtml]               = useState('');
  const [troubleshooterOpen, setTroubleshooterOpen] = useState(false);
  const [addQueryModel, setAddQueryModel]     = useState({ text: 'Add Query', value: null, fake: true });

  const queryOptions = currentDs?.meta?.queryOptions;
  const hasQueryHelp = currentDs?.meta?.hasQueryHelp;
  const isMixed      = currentDs?.meta?.mixed;

  // ── Datasource selection ──────────────────────────────────────────────────

  const getDatasourceOptions = useCallback((includeBuiltin = false) => {
    return Promise.resolve(
      datasources
        .filter(ds => includeBuiltin || !ds.meta.builtIn)
        .map(ds => ({ value: ds.value, text: ds.name, original: ds }))
    );
  }, [datasources]);

  const handleDatasourceChange = useCallback((opt: any) => {
    if (!opt) return;
    const ds = datasources.find(d => d.value === opt.value);
    if (!ds) return;

    // Switching to mixed: set target datasource on each target
    if (ds.meta.mixed) {
      _.each(panel.targets, target => {
        target.datasource = panel.datasource || config.defaultDatasource;
      });
    } else if (currentDs?.meta?.mixed) {
      _.each(panel.targets, target => { delete target.datasource; });
    }

    setCurrentDs(ds);
    panel.datasource = ds.value;
    panel.refresh?.();
    panelCtrl.nextRefId = dashboard?.getNextQueryLetter(panel);
  }, [datasources, currentDs, panel, panelCtrl, dashboard]);

  const handleAddQuery = useCallback(() => {
    panelCtrl?.addQuery({ isNew: true });
  }, [panelCtrl]);

  const handleAddMixedQuery = useCallback((opt: any) => {
    if (!opt) return;
    panelCtrl?.addQuery({ isNew: true, datasource: opt.datasource?.name });
    setAddQueryModel({ text: 'Add Query', value: null, fake: true });
  }, [panelCtrl]);

  // ── Footer toggles ────────────────────────────────────────────────────────

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
    if (next && currentDs?.meta?.id) {
      try {
        const res = await backendSrv.get(`/api/plugins/${currentDs.meta.id}/markdown/query_help`);
        setHelpHtml(new markdownit().render(res));
      } catch { setHelpHtml(''); }
    }
  }, [helpOpen, currentDs, backendSrv]);

  const toggleTroubleshooter = useCallback(() => {
    setHelpOpen(false);
    setOptionsOpen(false);
    setTroubleshooterOpen(v => !v);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Datasource selector row */}
      {currentDs && (
        <div className="gf-form-group">
          {/* Query targets — still Angular plugin-component directives */}
          {/* Rendered by the parent Angular template via ng-repeat + rebuild-on-change */}

          {/* Add Query row */}
          {panel?.type !== 'singlestat' && (
            <div className="gf-form-query">
              <div className="gf-form gf-form-query-letter-cell">
                <label className="gf-form-label">
                  <span className="gf-form-query-letter-cell-carret">
                    <i className="fa fa-caret-down" />
                  </span>
                  <span className="gf-form-query-letter-cell-letter">{panelCtrl?.nextRefId}</span>
                </label>

                {!isMixed && (
                  <button className="btn btn-secondary gf-form-btn" onClick={handleAddQuery}>
                    Add Query
                  </button>
                )}

                {isMixed && (
                  <div className="dropdown">
                    <FormDropdown
                      model={addQueryModel}
                      getOptions={() => getDatasourceOptions(false)}
                      onChange={handleAddMixedQuery}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: Options / Help / Query Inspector */}
      <div className="gf-form-group">
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
          {optionsOpen && panel && (
            <div>
              {queryOptions?.minInterval && (
                <div className="gf-form gf-form--flex-end">
                  <label className="gf-form-label">Min time interval</label>
                  <input
                    type="text"
                    className="gf-form-input width-6"
                    placeholder={panelCtrl?.interval}
                    defaultValue={panel.interval}
                    onBlur={e => { panel.interval = e.target.value; panel.refresh?.(); }}
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
                    onBlur={e => { panel.cacheTimeout = e.target.value; panel.refresh?.(); }}
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
                    onBlur={e => { panel.maxDataPoints = e.target.value; panel.refresh?.(); }}
                    spellCheck={false}
                  />
                  <InfoPopover mode="right-absolute">
                    The maximum data points the query should return.
                  </InfoPopover>
                </div>
              )}
            </div>
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
    </div>
  );
};

export default MetricsTab;
