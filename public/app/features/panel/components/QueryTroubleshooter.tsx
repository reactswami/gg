/**
 * QueryTroubleshooter
 *
 * React port of QueryTroubleshooterCtrl + template.
 * Replaces Angular directive: <query-troubleshooter panel-ctrl="..." is-open="...">
 *
 * Shows request/response data from the datasource as a collapsible JSON tree.
 * Listens to 'ds-request-response' and 'ds-request-error' appEvents.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import _ from 'lodash';
import { JsonExplorer } from 'app/core/components/json_explorer/json_explorer';
import appEvents from 'app/core/app_events';
import { useClipboard } from 'app/core/hooks/utilityHooks';

export interface QueryTroubleshooterProps {
  panelCtrl?: any;
  isOpen: boolean;
}

const QueryTroubleshooter: React.FC<QueryTroubleshooterProps> = ({ isOpen }) => {
  const [allExpanded, setAllExpanded]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [hasError, setHasError]         = useState(false);
  const [rawData, setRawData]           = useState<any>(null);

  const jsonContainerRef = useRef<HTMLDivElement>(null);
  const explorerRef      = useRef<any>(null);

  const { copy } = useClipboard(() => JSON.stringify(rawData, null, 2));

  // ── Render JSON explorer into DOM ─────────────────────────────────────────

  const renderExplorer = useCallback((data: any) => {
    if (!jsonContainerRef.current) return;
    explorerRef.current = new JsonExplorer(data, 3, { animateOpen: true });
    jsonContainerRef.current.innerHTML = '';
    const html = explorerRef.current.render(true);
    jsonContainerRef.current.innerHTML = html;
  }, []);

  // ── appEvent listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const onResponse = (data: any) => {
      setIsLoading(false);

      // Clean up the payload (matching Angular ctrl behaviour)
      const cleaned = _.cloneDeep(data);
      if (cleaned.request) {
        delete cleaned.request.headers;
        delete cleaned.request.retry;
        delete cleaned.request.timeout;
      }
      if (cleaned.data) {
        cleaned.response = cleaned.data;
        if (cleaned.status === 200 && hasError) {
          setHasError(false);
        }
        delete cleaned.data;
        delete cleaned.status;
        delete cleaned.statusText;
        delete cleaned.$$config;
      }

      setRawData(cleaned);
      setTimeout(() => renderExplorer(cleaned), 0);
    };

    const onError = (data: any) => {
      setHasError(true);
      onResponse(data);
    };

    appEvents.on('ds-request-response', onResponse);
    appEvents.on('ds-request-error', onError);

    return () => {
      appEvents.off('ds-request-response', onResponse);
      appEvents.off('ds-request-error', onError);
    };
  }, [hasError, renderExplorer]);

  const toggleExpand = useCallback(() => {
    const next = !allExpanded;
    setAllExpanded(next);
    if (explorerRef.current) {
      explorerRef.current.openAtDepth(next ? 20 : 1);
    }
  }, [allExpanded]);

  if (!isOpen) return null;

  return (
    <div className="query-troubleshooter">
      <div className="query-troubleshooter__header">
        <a className="pointer" onClick={toggleExpand}>
          {allExpanded ? (
            <><i className="fa fa-minus-square-o" /> Collapse All</>
          ) : (
            <><i className="fa fa-plus-square-o" /> Expand All</>
          )}
        </a>
        &nbsp;&nbsp;
        <a className="pointer" onClick={copy}>
          <i className="fa fa-clipboard" /> Copy to Clipboard
        </a>
      </div>
      <div className="query-troubleshooter__body">
        {isLoading && <i className="fa fa-spinner fa-spin" />}
        <div ref={jsonContainerRef} className="query-troubleshooter-json" />
      </div>
    </div>
  );
};

export default QueryTroubleshooter;
