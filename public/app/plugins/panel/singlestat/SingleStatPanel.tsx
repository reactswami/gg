/**
 * SingleStatPanel (React)
 *
 * React replacement for SingleStatCtrl + module.html.
 *
 * - Value calculation: singlestat-utils.ts (pure TS, no Angular)
 * - Gauge:            app/viz/Gauge (already React - replaces $.plot gauge)
 * - Sparkline:        SVG path (replaces $.plot sparkline - no Flot needed)
 * - Color thresholds: getColorForValue() from singlestat-utils
 *
 * Export name PanelComponent required by DashboardPanel/PanelChrome.
 */

import React, { useMemo, useCallback } from 'react';
import _ from 'lodash';
import { PanelProps } from 'app/types';
import TimeSeries from 'app/core/time_series2';
import Gauge from 'app/viz/Gauge';
import { getTemplateSrv } from 'app/features/templating/template_srv';
import {
  computeSingleStatData,
  getColorForValue,
  SingleStatPanel as SingleStatOptions,
} from './singlestat-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props extends PanelProps<SingleStatOptions> {
  timeSeries: any[];
  panel: any;
  dashboard: any;
}

// ---------------------------------------------------------------------------
// Sparkline SVG component (replaces $.plot sparkline)
// ---------------------------------------------------------------------------

interface SparklineProps {
  flotpairs: [number, number][];
  lineColor: string;
  fillColor: string;
  full: boolean;
  width: number;
  height: number;
}

const Sparkline: React.FC<SparklineProps> = ({
  flotpairs,
  lineColor,
  fillColor,
  full,
  width,
  height,
}) => {
  const path = useMemo(() => {
    if (!flotpairs?.length) return '';

    const xs = flotpairs.map(p => p[0]);
    const ys = flotpairs.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const toSvgX = (x: number) => ((x - minX) / rangeX) * width;
    const toSvgY = (y: number) => height - ((y - minY) / rangeY) * height;

    const points = flotpairs.map(([x, y]) => `${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    const linePath = `M${points.join('L')}`;
    const fillPath = `${linePath}L${toSvgX(xs[xs.length - 1]).toFixed(1)},${height}L${toSvgX(xs[0]).toFixed(1)},${height}Z`;

    return { linePath, fillPath };
  }, [flotpairs, width, height]);

  if (!path || typeof path === 'string') return null;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
    >
      <path d={path.fillPath} fill={fillColor} stroke="none" />
      <path d={path.linePath} fill="none" stroke={lineColor} strokeWidth={1} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// SingleStatPanel
// ---------------------------------------------------------------------------

const PANEL_DEFAULTS: Partial<SingleStatOptions> = {
  format: 'none',
  prefix: '',
  postfix: '',
  valueName: 'avg',
  nullPointMode: 'connected',
  mappingType: 1,
  valueMaps: [{ value: 'null', op: '=', text: 'N/A' }],
  rangeMaps: [{ from: 'null', to: 'null', text: 'N/A' }],
  coloring: [],
  colorBackground: false,
  colorValue: false,
  prefixFontSize: '50%',
  valueFontSize: '80%',
  postfixFontSize: '50%',
  sparkline: { show: false, full: false, lineColor: 'rgb(31,120,193)', fillColor: 'rgba(31,118,189,0.18)' },
  gauge: { show: false, markers: true, labels: false, minValue: 0, maxValue: 100 },
  nullText: null,
};

export const SingleStatPanel: React.FC<Props> = ({ options, panel, dashboard, timeSeries }) => {
  const opts = { ...PANEL_DEFAULTS, ...(options ?? panel?.options ?? {}) } as SingleStatOptions;
  const isUtc = dashboard?.timezone === 'utc';
  const templateSrv = getTemplateSrv();

  // -- Build time series objects ----------------------------------------------

  const series = useMemo<TimeSeries[]>(() => {
    if (!timeSeries?.length) return [];
    return timeSeries.map(s => {
      const ts = new TimeSeries({ datapoints: s.datapoints || [], alias: s.target });
      ts.flotpairs = ts.getFlotPairs(opts.nullPointMode);
      return ts;
    });
  }, [timeSeries, opts.nullPointMode]);

  // -- Compute stat value ----------------------------------------------------

  const data = useMemo(() => computeSingleStatData(series, opts, isUtc), [series, opts, isUtc]);

  // -- Color resolution ------------------------------------------------------

  const bgColor = useMemo(() => {
    if (!opts.colorBackground) return null;
    return getColorForValue(data, data.value, data.valueFormatted, s => templateSrv.replace(s));
  }, [data, opts.colorBackground, templateSrv]);

  const getTextColor = useCallback((enabled?: boolean) => {
    if (!enabled) return undefined;
    return getColorForValue(data, data.value, data.valueFormatted, s => templateSrv.replace(s)) ?? undefined;
  }, [data, templateSrv]);

  // -- Gauge props -----------------------------------------------------------

  const { getTimeSeriesVMs } = require('app/viz/state/timeSeries');
  const { NullValueMode } = require('app/types');

  const gaugeVMs = useMemo(() => {
    if (!opts.gauge?.show || !timeSeries?.length) return [];
    return getTimeSeriesVMs({ timeSeries: timeSeries || [], nullValueMode: NullValueMode.Ignore });
  }, [opts.gauge?.show, timeSeries]);

  // -- Render ----------------------------------------------------------------

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...(bgColor ? { backgroundColor: bgColor } : {}),
  };

  const hasSparkline = opts.sparkline?.show && data.flotpairs?.length > 0;
  const hasGauge = opts.gauge?.show;

  return (
    <div className="singlestat-panel" style={containerStyle}>
      {/* Gauge (replaces $.plot gauge) */}
      {hasGauge && (
        <Gauge
          timeSeries={gaugeVMs}
          minValue={opts.gauge?.minValue ?? 0}
          maxValue={opts.gauge?.maxValue ?? 100}
          thresholds={opts.coloring?.map(c => c.from ? Number(c.from) : 0) ?? [0, 100]}
        />
      )}

      {/* Big value display */}
      {!hasGauge && (
        <div className="singlestat-panel-value-container">
          {opts.prefix ? (
            <span
              className="singlestat-panel-prefix"
              style={{ fontSize: opts.prefixFontSize, color: getTextColor(opts.colorPrefix) }}
            >
              {templateSrv.replace(opts.prefix, data.scopedVars)}
            </span>
          ) : null}

          <span
            className="singlestat-panel-value"
            style={{ fontSize: opts.valueFontSize, color: getTextColor(opts.colorValue) }}
          >
            {data.valueFormatted}
          </span>

          {opts.postfix ? (
            <span
              className="singlestat-panel-postfix"
              style={{ fontSize: opts.postfixFontSize, color: getTextColor(opts.colorPostfix) }}
            >
              {templateSrv.replace(opts.postfix, data.scopedVars)}
            </span>
          ) : null}
        </div>
      )}

      {/* Sparkline SVG (replaces $.plot sparkline) */}
      {hasSparkline && (
        <Sparkline
          flotpairs={data.flotpairs}
          lineColor={opts.sparkline.lineColor}
          fillColor={opts.sparkline.fillColor}
          full={opts.sparkline.full}
          width={300}
          height={opts.sparkline.full ? 60 : 30}
        />
      )}
    </div>
  );
};

export { SingleStatPanel as PanelComponent };
