/**
 * singlestat-utils.ts
 *
 * Pure TypeScript value calculation extracted from SingleStatCtrl.
 * No Angular dependencies - safe to import from React components.
 *
 * Covers: stat aggregation, decimal formatting, value/range mapping,
 * color threshold resolution, sparkline data prep.
 */

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColoringRule {
  type: 'range' | 'regex';
  from: string;
  to: string;
  regex: string;
  color: string;
  mode: string | null;
}

export interface ValueMap {
  value: string;
  op: string;
  text: string;
}

export interface RangeMap {
  from: string;
  to: string;
  text: string;
}

export interface SingleStatData {
  value: number | null;
  valueFormatted: string;
  valueRounded: number;
  flotpairs: [number, number][];
  scopedVars: Record<string, any>;
  coloring: ColoringRule[];
}

export interface SingleStatPanel {
  valueName: string;
  format: string;
  decimals?: number;
  nullPointMode: string;
  mappingType: number;
  valueMaps: ValueMap[];
  rangeMaps: RangeMap[];
  nullText: string | null;
  coloring: ColoringRule[];
  tableColumn: string;
  colorBackground: boolean;
  colorValue: boolean;
  colorPrefix?: boolean;
  colorPostfix?: boolean;
  prefix: string;
  postfix: string;
  prefixFontSize: string;
  valueFontSize: string;
  postfixFontSize: string;
  sparkline: {
    show: boolean;
    full: boolean;
    lineColor: string;
    fillColor: string;
  };
  gauge: {
    show: boolean;
    markers: boolean;
    labels: boolean;
    minValue?: number;
    maxValue?: number;
  };
}

// ---------------------------------------------------------------------------
// getDecimalsForValue - direct port from SingleStatCtrl
// ---------------------------------------------------------------------------

export function getDecimalsForValue(
  value: number | null,
  panelDecimals?: number
): { decimals: number; scaledDecimals: number | null } {
  if (_.isNumber(panelDecimals)) {
    return { decimals: panelDecimals, scaledDecimals: null };
  }

  if (value === null || value === undefined || value === 0) {
    return { decimals: 2, scaledDecimals: null };
  }

  const delta = Math.abs(value) / 2;
  let dec = -Math.floor(Math.log(delta) / Math.LN10);

  const magn = Math.pow(10, -dec);
  const norm = delta / magn;
  let size: number;

  if (norm < 1.5) {
    size = 1;
  } else if (norm < 3) {
    size = 2;
    if (norm > 2.25) { size = 2.5; ++dec; }
  } else if (norm < 7.5) {
    size = 5;
  } else {
    size = 10;
  }

  size *= magn;

  if (Math.floor(value) === value) { dec = 0; }

  const result = { decimals: Math.max(0, dec), scaledDecimals: dec - Math.floor(Math.log(size) / Math.LN10) + 2 };
  return result;
}

// ---------------------------------------------------------------------------
// getColorForValue - direct port from module.ts (exported function)
// ---------------------------------------------------------------------------

export function getColorForValue(
  data: { coloring?: ColoringRule[] },
  value: number | null,
  valueString?: string | null,
  templateReplace?: (s: string) => string
): string | null {
  if (!data.coloring || !data.coloring.length) return null;

  const replace = templateReplace ?? (s => s);

  for (let i = data.coloring.length - 1; i >= 0; i--) {
    const rule = data.coloring[i];

    if (rule.type === 'range') {
      const from = rule.from === '' ? -Infinity : Number(replace(String(rule.from)));
      const to   = rule.to   === '' ?  Infinity : Number(replace(String(rule.to)));
      if (Number(value) >= from && Number(value) <= to) {
        return rule.color;
      }
    } else if (rule.type === 'regex') {
      const subject = valueString != null ? valueString : String(Number(value));
      const regex = kbn.stringToJsRegex(replace(rule.regex));
      if (subject.toString().match(regex)) {
        return rule.color;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// applyValueMapping - direct port of setValueMapping()
// ---------------------------------------------------------------------------

function applyValueMapping(
  data: SingleStatData,
  panel: Pick<SingleStatPanel, 'mappingType' | 'valueMaps' | 'rangeMaps'>
): void {
  if (panel.mappingType === 1) {
    // value to text
    for (const map of panel.valueMaps) {
      if (map.value === 'null') {
        if (data.value === null || data.value === undefined) {
          data.valueFormatted = map.text;
          return;
        }
        continue;
      }
      const mapVal = parseFloat(map.value);
      if (mapVal === data.valueRounded || map.value === data.valueFormatted) {
        data.valueFormatted = map.text;
        return;
      }
    }
  } else if (panel.mappingType === 2) {
    // range to text
    for (const map of panel.rangeMaps) {
      if (map.from === 'null' && map.to === 'null') {
        if (data.value === null || data.value === undefined) {
          data.valueFormatted = map.text;
          return;
        }
        continue;
      }
      if (data.value !== null && Number(map.from) <= data.value && data.value <= Number(map.to)) {
        data.valueFormatted = map.text;
        return;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// computeSingleStatData - main entry point
// ---------------------------------------------------------------------------

/**
 * Process a list of time series into a SingleStatData object.
 * Equivalent to SingleStatCtrl.setValues() - setValueMapping().
 */
export function computeSingleStatData(
  seriesList: TimeSeries[],
  panel: SingleStatPanel,
  isUtc: boolean
): SingleStatData {
  const data: SingleStatData = {
    value: null,
    valueFormatted: 'no value',
    valueRounded: 0,
    flotpairs: [],
    scopedVars: { ...(panel as any).scopedVars },
    coloring: panel.coloring || [],
  };

  if (!seriesList?.length) return data;

  if (seriesList.length > 1) {
    data.valueFormatted = 'Multiple Series Error';
    return data;
  }

  const series = seriesList[0];
  data.flotpairs = series.getFlotPairs(panel.nullPointMode) as [number, number][];

  const stats = series.stats;
  const formatFunc = kbn.valueFormats[panel.format] ?? kbn.valueFormats['none'];

  if (panel.valueName === 'name') {
    data.value = 0;
    data.valueRounded = 0;
    data.valueFormatted = series.label ?? series.alias ?? '';
  } else if (panel.valueName === 'last_time') {
    const lastPoint = _.last(series.datapoints);
    data.value = lastPoint ? lastPoint[1] / 1000 : null;
    data.valueRounded = data.value ?? 0;
    data.valueFormatted = formatFunc(data.value, isUtc);
  } else {
    data.value = stats[panel.valueName] ?? null;
    if (data.value !== null) {
      const dec = getDecimalsForValue(data.value, panel.decimals);
      data.valueFormatted = formatFunc(data.value, dec.decimals, dec.scaledDecimals);
      data.valueRounded = kbn.roundValue(data.value, dec.decimals);
    }
  }

  if (data.value === null || data.value === undefined) {
    data.valueFormatted = panel.nullText ?? 'no value';
  }

  // Add __name scoped var
  data.scopedVars['__name'] = { value: series.label ?? series.alias ?? '' };

  applyValueMapping(data, panel);

  return data;
}
