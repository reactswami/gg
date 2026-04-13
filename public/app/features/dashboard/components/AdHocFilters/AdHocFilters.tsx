/**
 * AdHocFilters
 *
 * React port of AdHocFiltersCtrl (features/dashboard/ad_hoc_filters.ts).
 * Replaces Angular directive: <ad-hoc-filters variable="...">
 *
 * Renders an inline key-operator-value filter builder using MetricSegment
 * for each segment. Syncs filter state back to variable.filters and triggers
 * variableSrv.variableUpdated.
 */

import React, { useState, useEffect, useCallback } from 'react';
import MetricSegment, { SegmentOption } from 'app/core/components/MetricSegment/MetricSegment';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useAppEvents } from 'app/core/hooks/useAppEvents';
import _ from 'lodash';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdHocFilter {
  key: string;
  operator: string;
  value: string;
  condition?: string;
}

interface AdHocVariable {
  datasource: string;
  filters: AdHocFilter[];
  setFilters: (filters: AdHocFilter[]) => void;
}

export interface AdHocFiltersProps {
  variable: AdHocVariable;
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

const OPERATORS = ['=', '!=', '<', '>', '=~', '!~'];
const REMOVE_VALUE = '-- remove filter --';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdHocFilters: React.FC<AdHocFiltersProps> = ({ variable }) => {
  const datasourceSrv = useAngularService<any>('datasourceSrv');
  const variableSrv   = useAngularService<any>('variableSrv');

  const [filters, setFilters] = useState<AdHocFilter[]>(variable.filters || []);

  // Re-sync when template variables update
  useAppEvents('template-variable-value-updated', () => {
    setFilters([...(variable.filters || [])]);
  });

  // -- Options loaders -------------------------------------------------------

  const getKeyOptions = useCallback(async (): Promise<SegmentOption[]> => {
    try {
      const ds = await datasourceSrv.get(variable.datasource);
      const keys: any[] = ds.getTagKeys ? await ds.getTagKeys() : [];
      const opts = keys.map(k => ({ value: k.text, text: k.text }));
      opts.unshift({ value: REMOVE_VALUE, text: REMOVE_VALUE, fake: true });
      return opts;
    } catch {
      return [{ value: REMOVE_VALUE, text: REMOVE_VALUE, fake: true }];
    }
  }, [datasourceSrv, variable.datasource]);

  const getValueOptions = useCallback(async (key: string): Promise<SegmentOption[]> => {
    try {
      const ds = await datasourceSrv.get(variable.datasource);
      const values: any[] = ds.getTagValues ? await ds.getTagValues({ key }) : [];
      return values.map(v => ({ value: v.text, text: v.text }));
    } catch {
      return [];
    }
  }, [datasourceSrv, variable.datasource]);

  const getOperatorOptions = async (): Promise<SegmentOption[]> =>
    OPERATORS.map(op => ({ value: op, text: op }));

  // -- Update variable -------------------------------------------------------

  const commitFilters = useCallback((newFilters: AdHocFilter[]) => {
    variable.filters = newFilters;
    variable.setFilters?.(newFilters);
    variableSrv.variableUpdated(variable, true);
  }, [variable, variableSrv]);

  // -- Filter operations -----------------------------------------------------

  const addFilter = useCallback(() => {
    const newFilter: AdHocFilter = { key: '', operator: '=', value: '' };
    const updated = [...filters, newFilter];
    setFilters(updated);
    commitFilters(updated);
  }, [filters, commitFilters]);

  const removeFilter = useCallback((idx: number) => {
    const updated = filters.filter((_, i) => i !== idx);
    setFilters(updated);
    commitFilters(updated);
  }, [filters, commitFilters]);

  const updateFilterKey = useCallback((idx: number, key: string) => {
    if (key === REMOVE_VALUE) {
      removeFilter(idx);
      return;
    }
    const updated = filters.map((f, i) => i === idx ? { ...f, key } : f);
    setFilters(updated);
    commitFilters(updated);
  }, [filters, removeFilter, commitFilters]);

  const updateFilterOperator = useCallback((idx: number, operator: string) => {
    const updated = filters.map((f, i) => i === idx ? { ...f, operator } : f);
    setFilters(updated);
    commitFilters(updated);
  }, [filters, commitFilters]);

  const updateFilterValue = useCallback((idx: number, value: string) => {
    const updated = filters.map((f, i) => i === idx ? { ...f, value } : f);
    setFilters(updated);
    commitFilters(updated);
  }, [filters, commitFilters]);

  // -- Render ----------------------------------------------------------------

  return (
    <div className="gf-form-inline">
      {filters.map((filter, idx) => (
        <React.Fragment key={idx}>
          {/* AND condition between filters */}
          {idx > 0 && (
            <div className="gf-form">
              <span className="gf-form-label query-keyword">AND</span>
            </div>
          )}

          {/* Key segment */}
          <div className="gf-form">
            <MetricSegment
              segment={{ value: filter.key || 'select key', text: filter.key || 'select key', cssClass: 'query-segment-key' }}
              getOptions={() => getKeyOptions()}
              onChange={opt => updateFilterKey(idx, opt.value)}
            />
          </div>

          {/* Operator segment */}
          <div className="gf-form">
            <MetricSegment
              segment={{ value: filter.operator || '=', cssClass: 'query-segment-operator' }}
              getOptions={() => getOperatorOptions()}
              onChange={opt => updateFilterOperator(idx, opt.value)}
            />
          </div>

          {/* Value segment */}
          <div className="gf-form">
            <MetricSegment
              segment={{ value: filter.value || 'select value', text: filter.value || 'select value', cssClass: 'query-segment-value' }}
              getOptions={() => getValueOptions(filter.key)}
              onChange={opt => updateFilterValue(idx, opt.value)}
            />
          </div>
        </React.Fragment>
      ))}

      {/* Add filter button */}
      <div className="gf-form">
        <a
          className="gf-form-label gf-form-label--btn query-part"
          onClick={addFilter}
          title="Add filter"
        >
          <i className="fa fa-plus" />
        </a>
      </div>
    </div>
  );
};

export default AdHocFilters;
