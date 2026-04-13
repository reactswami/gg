/**
 * GraphPanel (React - Option A: Flot ref wrapper)
 *
 * Wraps the existing GraphElement/Flot implementation imperatively into a
 * React component using a ref div. No Flot logic is rewritten - GraphCtrl
 * and GraphElement continue to own all rendering.
 *
 * Strategy:
 *   1. On mount, instantiate GraphCtrl (via Angular DI) and wire it to
 *      a minimal scope shim that provides what GraphElement expects.
 *   2. Pass the ref div to GraphElement as its jQuery elem.
 *   3. On each data/panel change from PanelChrome, call ctrl.onDataReceived()
 *      which triggers ctrl.render() - GraphElement.onRender() - $.plot().
 *   4. On unmount, call ctrl.events.emit('panel-teardown') for cleanup.
 *
 * This approach keeps 100% fidelity with the existing graph behaviour
 * (threshold overlays, time regions, tooltip, cross-panel hover sync,
 * legend React component, series overrides, histogram mode, axes editor)
 * while eliminating Angular routing and HTML template dependencies.
 *
 * Export name PanelComponent required by DashboardPanel/PanelChrome.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import $ from 'jquery';
import { PanelProps } from 'app/types';
import { DataProcessor } from './data_processor';
import { GraphCtrl } from './module';
import { getAngularInjector } from 'app/core/services/AngularLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props extends PanelProps<any> {
  timeSeries: any[];
  panel: any;
  dashboard: any;
  timeRange?: any;
}

// ---------------------------------------------------------------------------
// Minimal Angular scope shim
// ---------------------------------------------------------------------------

function createScopeShim(ctrl: GraphCtrl, dashboard: any) {
  // GraphElement reads scope.ctrl and scope.$on / scope.$watch
  // We provide just enough for it to function.
  const listeners: Record<string, Function[]> = {};
  const scope: any = {
    ctrl,
    dashboard,
    fullscreen: false,
    $$phase: null,

    $on(event: string, cb: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      return () => {
        listeners[event] = listeners[event].filter(f => f !== cb);
      };
    },

    $emit(event: string, ...args: any[]) {
      (listeners[event] || []).forEach(f => f({}, ...args));
    },

    $apply(fn?: Function) { fn?.(); },
    $applyAsync(fn?: Function) { setTimeout(() => fn?.(), 0); },
    $watch() { return () => {}; },
    $broadcast() {},
    $destroy() { scope.$emit('$destroy'); },
  };

  return scope;
}

// ---------------------------------------------------------------------------
// GraphPanel component
// ---------------------------------------------------------------------------

export const GraphPanel: React.FC<Props> = ({
  panel,
  dashboard,
  timeSeries,
  timeRange,
  options,
  refreshCounter,
}) => {
  const graphRef  = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const ctrlRef   = useRef<GraphCtrl | null>(null);
  const scopeRef  = useRef<any>(null);

  // -- Mount: create GraphCtrl + GraphElement --------------------------------

  useEffect(() => {
    if (!graphRef.current) return;

    const injector = getAngularInjector();
    if (!injector) {
      console.warn('GraphPanel: Angular injector not available yet');
      return;
    }

    // Instantiate GraphCtrl via Angular DI
    const ctrl: GraphCtrl = injector.instantiate(GraphCtrl, {
      $scope: null, // will be set below via scope shim
      $injector: injector,
    });

    // Wire panel and dashboard
    ctrl.panel     = panel;
    ctrl.dashboard = dashboard;
    ctrl.range     = timeRange;
    ctrl.processor = new DataProcessor(panel);

    // Apply panel defaults
    ctrl.$onInit?.();

    // Build scope shim
    const scope = createScopeShim(ctrl, dashboard);
    scope.ctrl = ctrl;
    ctrl.$scope = scope;
    scopeRef.current = scope;
    ctrlRef.current  = ctrl;

    // Mount GraphElement into the ref div
    // GraphElement expects a jQuery-wrapped element
    const $elem = $(graphRef.current);

    // Inject legend element reference into the DOM structure
    // GraphElement looks for .graph-legend via elem.parent().find('.graph-legend')
    const $legendElem = legendRef.current ? $(legendRef.current) : null;

    // Dynamically import to avoid circular - graph.ts registers the directive
    // but we need the GraphElement class directly
    import('./graph').then(({ GraphElement }) => {
      // Bind legend elem before constructing GraphElement
      if ($legendElem) {
        (ctrl as any).legendElem = $legendElem[0];
      }

      new GraphElement(scope, $elem, injector.get('timeSrv'), injector);

      // Initial data render
      if (timeSeries?.length) {
        ctrl.onDataReceived(timeSeries);
      }
    });

    return () => {
      // Teardown: let GraphElement clean up tooltip, appEvent listeners, Flot
      ctrl.events.emit('panel-teardown');
      scope.$destroy();
      ctrlRef.current  = null;
      scopeRef.current = null;
    };
  // Only run on mount/unmount - panel identity doesn't change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Data updates: push new time series into the ctrl ---------------------

  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl || !timeSeries) return;

    // Update time range on ctrl before processing data
    ctrl.range = timeRange;
    ctrl.onDataReceived(timeSeries);
  }, [timeSeries, timeRange, refreshCounter]);

  // -- Panel option changes: re-render without new data ---------------------

  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.panel = panel;
    ctrl.render();
  }, [panel, options]);

  // -- Render ----------------------------------------------------------------

  return (
    <div className="graph-panel" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Graph canvas - GraphElement mounts Flot here */}
      <div
        ref={graphRef}
        className="graph-canvas"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Legend - GraphElement renders React Legend here via ReactDOM.render */}
      <div ref={legendRef} className="graph-legend" />
    </div>
  );
};

export { GraphPanel as PanelComponent };
