/**
 * TablePanelEditor
 *
 * React options panel for the table plugin, replacing editor.html and
 * column_options.html.
 *
 * Provides: transform selector, paging, scroll, font size,
 * and per-column style configuration.
 */

import React, { useCallback } from 'react';
import { PanelOptionsProps } from 'app/types';
import { Switch } from 'app/core/components/Switch/Switch';
import { transformers } from './transformers';

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
  thresholds?: string[];
  colorMode?: string;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_SIZES = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];
const COLUMN_TYPES = ['number', 'string', 'date', 'hidden'];
const COLOR_MODES = ['cell', 'value', 'row'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TablePanelEditor: React.FC<PanelOptionsProps<TableOptions>> = ({
  options,
  onChange,
}) => {
  const opts = options ?? {} as TableOptions;

  const update = useCallback(
    (patch: Partial<TableOptions>) => onChange({ ...opts, ...patch }),
    [opts, onChange]
  );

  const updateStyle = useCallback(
    (index: number, patch: Partial<TableStyle>) => {
      const styles = [...(opts.styles ?? [])];
      styles[index] = { ...styles[index], ...patch };
      update({ styles });
    },
    [opts.styles, update]
  );

  const addStyle = useCallback(() => {
    update({
      styles: [...(opts.styles ?? []), { pattern: '/.*/', type: 'number', decimals: 2, thresholds: [] }],
    });
  }, [opts.styles, update]);

  const removeStyle = useCallback(
    (index: number) => {
      const styles = (opts.styles ?? []).filter((_, i) => i !== index);
      update({ styles });
    },
    [opts.styles, update]
  );

  // -- Render ----------------------------------------------------------------

  return (
    <div>
      {/* Paging & layout */}
      <div className="editor-row">
        <div className="section gf-form-group">
          <h5 className="section-heading">Table</h5>

          <div className="gf-form">
            <label className="gf-form-label width-8">Data transform</label>
            <div className="gf-form-select-wrapper">
              <select
                className="gf-form-input width-10"
                value={opts.transform ?? 'timeseries_to_columns'}
                onChange={e => update({ transform: e.target.value })}
              >
                {Object.keys(transformers).map(key => (
                  <option key={key} value={key}>{transformers[key].description}</option>
                ))}
              </select>
            </div>
          </div>

          <Switch
            label="Show header"
            labelClass="width-8"
            switchClass="max-width-7"
            checked={opts.showHeader !== false}
            onChange={() => update({ showHeader: !opts.showHeader })}
          />
        </div>

        <div className="section gf-form-group">
          <h5 className="section-heading">Paging</h5>

          <div className="gf-form">
            <label className="gf-form-label width-8">Rows per page</label>
            <input
              type="number"
              className="gf-form-input width-7"
              placeholder="100"
              value={opts.pageSize ?? ''}
              onChange={e => update({ pageSize: parseInt(e.target.value, 10) || null })}
            />
          </div>

          <Switch
            label="Scroll"
            labelClass="width-8"
            switchClass="max-width-7"
            checked={opts.scroll !== false}
            onChange={() => update({ scroll: !opts.scroll })}
          />

          <div className="gf-form max-width-17">
            <label className="gf-form-label width-8">Font size</label>
            <div className="gf-form-select-wrapper width-7">
              <select
                className="gf-form-input"
                value={opts.fontSize ?? '100%'}
                onChange={e => update({ fontSize: e.target.value })}
              >
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Column styles */}
      <div className="editor-row">
        <div className="section gf-form-group">
          <h5 className="section-heading">Column styles</h5>

          {(opts.styles ?? []).map((style, idx) => (
            <div key={idx} className="gf-form-inline" style={{ marginBottom: 8, alignItems: 'center' }}>
              <div className="gf-form">
                <label className="gf-form-label width-5">Pattern</label>
                <input
                  type="text"
                  className="gf-form-input width-10"
                  value={style.pattern}
                  onChange={e => updateStyle(idx, { pattern: e.target.value })}
                />
              </div>
              <div className="gf-form">
                <label className="gf-form-label width-4">Type</label>
                <div className="gf-form-select-wrapper width-7">
                  <select
                    className="gf-form-input"
                    value={style.type}
                    onChange={e => updateStyle(idx, { type: e.target.value })}
                  >
                    {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {style.type === 'number' && (
                <div className="gf-form">
                  <label className="gf-form-label width-5">Decimals</label>
                  <input
                    type="number"
                    className="gf-form-input width-4"
                    value={style.decimals ?? 2}
                    onChange={e => updateStyle(idx, { decimals: parseInt(e.target.value, 10) })}
                  />
                </div>
              )}
              {style.type === 'date' && (
                <div className="gf-form">
                  <label className="gf-form-label width-6">Date format</label>
                  <input
                    type="text"
                    className="gf-form-input width-12"
                    value={style.dateFormat ?? 'YYYY-MM-DD HH:mm:ss'}
                    onChange={e => updateStyle(idx, { dateFormat: e.target.value })}
                  />
                </div>
              )}
              <div className="gf-form">
                <label className="gf-form-label width-4">Alias</label>
                <input
                  type="text"
                  className="gf-form-input width-8"
                  value={style.alias ?? ''}
                  placeholder="column name"
                  onChange={e => updateStyle(idx, { alias: e.target.value })}
                />
              </div>
              <button
                className="btn btn-danger btn-small"
                onClick={() => removeStyle(idx)}
                style={{ marginLeft: 8 }}
              >
                <i className="fa fa-trash" />
              </button>
            </div>
          ))}

          <button className="btn btn-inverse btn-small" onClick={addStyle}>
            <i className="fa fa-plus" /> Add column style
          </button>
        </div>
      </div>
    </div>
  );
};

export { TablePanelEditor as PanelOptionsComponent };
