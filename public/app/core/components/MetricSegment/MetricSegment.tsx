/**
 * MetricSegment
 *
 * React port of the metricSegment Angular directive (directives/metric_segment.ts).
 * Replaces Bootstrap typeahead + jQuery DOM manipulation with a React combobox.
 *
 * The segment object shape matches what uiSegmentSrv produces:
 *   { value, html, fake, expandable, cssClass, selectMode, focus }
 *
 * Usage:
 *   <MetricSegment
 *     segment={segment}
 *     getOptions={query => Promise<Segment[]>}
 *     onChange={segment => void}
 *   />
 */

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import _ from 'lodash';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SegmentOption {
  value: string;
  text?: string;
  html?: string;
  expandable?: boolean;
  type?: string;
  fake?: boolean;
  cssClass?: string;
}

export interface MetricSegmentProps {
  segment: SegmentOption;
  getOptions: (query: string) => Promise<SegmentOption[]>;
  onChange: (segment: SegmentOption) => void;
  debounce?: boolean;
  /** If true, render as a dropdown-style input instead of a link */
  selectMode?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MetricSegment: React.FC<MetricSegmentProps> = ({
  segment,
  getOptions,
  onChange,
  debounce = false,
  selectMode,
}) => {
  const [isOpen, setIsOpen]         = useState(false);
  const [query, setQuery]           = useState('');
  const [options, setOptions]       = useState<SegmentOption[]>([]);
  const [loading, setLoading]       = useState(false);
  const [highlight, setHighlight]   = useState(-1);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Focus input when segment.focus is set
  useEffect(() => {
    if ((segment as any).focus && isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [(segment as any).focus, isOpen]);

  // -- Load options ----------------------------------------------------------

  const loadOptions = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const results = await getOptions(q);
      setOptions(results);
    } finally {
      setLoading(false);
    }
  }, [getOptions]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setHighlight(-1);
    loadOptions('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [loadOptions]);

  // -- Select option ---------------------------------------------------------

  const selectOption = useCallback((option: SegmentOption) => {
    if (option.value === segment.value) {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    const updated: SegmentOption = {
      ...segment,
      value: option.value,
      html: option.html || option.text || option.value,
      fake: false,
      expandable: option.expandable,
    };
    if (option.type) updated.type = option.type;

    setIsOpen(false);
    onChange(updated);
  }, [segment, onChange]);

  // -- Input handling --------------------------------------------------------

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlight(-1);

    if (debounce) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => loadOptions(val), 500);
    } else {
      loadOptions(val);
    }
  }, [debounce, loadOptions]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      setHighlight(h => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      selectOption(options[highlight]);
    } else if (e.key === 'Enter' && query && !options.find(o => o.value === query)) {
      // custom value
      const custom: SegmentOption = { ...segment, value: query, html: query, fake: false, expandable: true };
      setIsOpen(false);
      onChange(custom);
    }
  }, [options, highlight, query, segment, onChange, selectOption]);

  const handleBlur = useCallback(() => {
    // Delay so click on option fires first
    setTimeout(() => {
      if (query && query !== segment.value) {
        const matched = options.find(o => o.value === query || o.text === query);
        if (matched) {
          selectOption(matched);
        }
      }
      setIsOpen(false);
    }, 200);
  }, [query, segment.value, options, selectOption]);

  // -- Display text ----------------------------------------------------------

  const display = (segment as any).html || segment.text || segment.value || '';
  const cssClass = segment.cssClass || '';
  const isSelectMode = selectMode || (segment as any).selectMode;

  // -- Render ----------------------------------------------------------------

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      {!isOpen && (
        <a
          className={isSelectMode ? `gf-form-input gf-form-input--dropdown ${cssClass}` : `gf-form-label ${cssClass}`}
          tabIndex={1}
          onClick={open}
          dangerouslySetInnerHTML={{ __html: display }}
        />
      )}

      {/* Input + dropdown */}
      {isOpen && (
        <span>
          <input
            ref={inputRef}
            type="text"
            className="gf-form-input input-medium"
            spellCheck={false}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{ display: 'inline-block' }}
          />
          {(options.length > 0 || loading) && (
            <ul
              className="typeahead dropdown-menu"
              style={{ display: 'block', position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}
            >
              {loading && <li className="disabled"><a>Loading-</a></li>}
              {options.map((opt, idx) => (
                <li
                  key={opt.value}
                  className={idx === highlight ? 'active' : ''}
                  onMouseDown={() => selectOption(opt)}
                >
                  <a dangerouslySetInnerHTML={{ __html: opt.html || opt.text || opt.value }} />
                </li>
              ))}
            </ul>
          )}
        </span>
      )}
    </span>
  );
};

export default MetricSegment;
