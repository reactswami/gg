/**
 * ValueSelectDropdown
 *
 * React port of ValueSelectDropdownCtrl (directives/value_select_dropdown.ts)
 * and valueSelectDropdown.html.
 *
 * Replaces Angular directive: <value-select-dropdown variable="..." on-updated="...">
 * New Angular registration:   <value-select-dropdown variable="..." on-updated="...">  (same element name)
 */

import React, { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import _ from 'lodash';
import { useAppEvents } from 'app/core/hooks/useAppEvents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VariableOption {
  text: string;
  value: string | string[];
  selected: boolean;
}

export interface VariableTag {
  text: string;
  selected: boolean;
  values?: string[];
  valuesText?: string;
}

export interface TemplateVariable {
  current: {
    text: string;
    value: string | string[];
    tags?: VariableTag[];
  };
  options: VariableOption[];
  tags?: string[];
  multi: boolean;
  getValuesForTag?: (tagText: string) => Promise<string[]>;
}

export interface ValueSelectDropdownProps {
  variable: TemplateVariable;
  onUpdated: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeLinkText(variable: TemplateVariable, selectedValues: VariableOption[]): string {
  const current = variable.current;
  if (current.tags && current.tags.length) {
    const selectedAndNotInTag = selectedValues.filter(option => {
      for (const tag of current.tags!) {
        if (tag.values && tag.values.indexOf(String(option.value)) !== -1) {
          return false;
        }
      }
      return true;
    });
    const texts = selectedAndNotInTag.map(o => o.text);
    return texts.length > 0 ? texts.join(' + ') + ' + ' : '';
  }
  return current.text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ValueSelectDropdown: React.FC<ValueSelectDropdownProps> = ({ variable, onUpdated }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState<VariableOption[]>([]);
  const [options, setOptions] = useState<VariableOption[]>([]);
  const [selectedValues, setSelectedValues] = useState<VariableOption[]>([]);
  const [tags, setTags] = useState<VariableTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<VariableTag[]>([]);
  const [linkText, setLinkText] = useState(variable.current.text);

  const oldVariableTextRef = useRef(variable.current.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep linkText in sync when variable changes from outside
  useEffect(() => {
    const selected = _.filter(variable.options, { selected: true }) as VariableOption[];
    setLinkText(computeLinkText(variable, selected));
  }, [variable]);

  // Sync link text when template-variable-value-updated fires
  useAppEvents('template-variable-value-updated', () => {
    const selected = _.filter(variable.options, { selected: true }) as VariableOption[];
    setLinkText(computeLinkText(variable, selected));
  });

  // Focus input when dropdown opens
  useEffect(() => {
    if (dropdownVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dropdownVisible]);

  // -------------------------------------------------------------------------
  // Show / hide
  // -------------------------------------------------------------------------

  const show = useCallback(() => {
    oldVariableTextRef.current = variable.current.text;

    const opts = variable.options;
    const selected = _.filter(opts, { selected: true }) as VariableOption[];
    const varTags = _.map(variable.tags || [], value => {
      let tag: VariableTag = { text: value, selected: false };
      _.each(variable.current.tags || [], tagObj => {
        if (tagObj.text === value) {
          tag = { ...tagObj };
        }
      });
      return tag;
    });

    setOptions(opts);
    setSelectedValues(selected);
    setTags(varTags);
    setSelectedTags(_.filter(varTags, { selected: true }));
    setSearchQuery('');
    setSearchOptions(opts.slice(0, Math.min(opts.length, 1000)));
    setHighlightIndex(-1);
    setDropdownVisible(true);
  }, [variable]);

  // -------------------------------------------------------------------------
  // Selection logic
  // -------------------------------------------------------------------------

  const syncToVariable = useCallback(
    (
      currentOptions: VariableOption[],
      currentTags: VariableTag[],
      commit: boolean,
      currentSearch: { query: string; options: VariableOption[] }
    ) => {
      let newSelected = _.filter(currentOptions, { selected: true }) as VariableOption[];

      if (newSelected.length > 1 && newSelected[0].text === 'All') {
        newSelected[0].selected = false;
        newSelected = newSelected.slice(1);
      }

      // Validate selected tags
      const validTags = currentTags.map(tag => {
        if (tag.selected && tag.values) {
          const stillValid = tag.values.some(v =>
            newSelected.some(s => String(s.value) === v)
          );
          return { ...tag, selected: stillValid };
        }
        return tag;
      });

      const newSelectedTags = _.filter(validTags, { selected: true });

      variable.current.value = newSelected.map(s => String(s.value));
      variable.current.text = newSelected.map(s => s.text).join(' + ');
      variable.current.tags = newSelectedTags;

      if (!variable.multi && newSelected.length > 0) {
        variable.current.value = String(newSelected[0].value);
      }

      setSelectedValues(newSelected);
      setSelectedTags(newSelectedTags);
      setTags(validTags);

      if (commit) {
        // Commit: close dropdown and call onUpdated if text changed
        let finalQuery = currentSearch.query;
        if (currentSearch.options.length === 0 && finalQuery.length > 0) {
          variable.current = { text: finalQuery, value: finalQuery, tags: [] };
        } else if (newSelected.length === 0 && currentOptions.length > 0) {
          currentOptions[0].selected = true;
          setOptions([...currentOptions]);
        }

        setDropdownVisible(false);
        const newLinkText = computeLinkText(variable, newSelected);
        setLinkText(newLinkText);

        if (variable.current.text !== oldVariableTextRef.current) {
          onUpdated();
        }
      }
    },
    [variable, onUpdated]
  );

  const selectValue = useCallback(
    (
      option: VariableOption,
      evt: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean },
      commit = false,
      excludeOthers = false
    ) => {
      if (!option) return;

      const newOptions = [...options];
      const target = newOptions.find(o => o === option || o.value === option.value);
      if (!target) return;

      target.selected = variable.multi ? !target.selected : true;

      if (commit) target.selected = true;

      const setAllExcept = (val: boolean) => {
        newOptions.forEach(o => { if (o !== target) o.selected = val; });
      };

      let shouldCommit = commit;

      if (target.text === 'All' || excludeOthers) {
        setAllExcept(false);
        shouldCommit = true;
      } else if (!variable.multi) {
        setAllExcept(false);
        shouldCommit = true;
      } else if (evt.ctrlKey || evt.metaKey || evt.shiftKey) {
        shouldCommit = true;
        setAllExcept(false);
      }

      setOptions(newOptions);
      syncToVariable(newOptions, tags, shouldCommit, { query: searchQuery, options: searchOptions });
    },
    [options, variable, tags, searchQuery, searchOptions, syncToVariable]
  );

  const clearSelections = useCallback(() => {
    const newOptions = options.map(o => ({ ...o, selected: false }));
    setOptions(newOptions);
    syncToVariable(newOptions, tags, false, { query: searchQuery, options: searchOptions });
  }, [options, tags, searchQuery, searchOptions, syncToVariable]);

  const selectTag = useCallback(
    async (tag: VariableTag) => {
      const newTag = { ...tag, selected: !tag.selected };
      let values = tag.values;

      if (!values && variable.getValuesForTag) {
        values = await variable.getValuesForTag(tag.text);
      }

      newTag.values = values || [];
      newTag.valuesText = newTag.values.join(' + ');

      const newOptions = options.map(o => ({
        ...o,
        selected: newTag.values!.indexOf(String(o.value)) !== -1 ? newTag.selected : o.selected,
      }));

      const newTags = tags.map(t => t.text === tag.text ? newTag : t);
      setOptions(newOptions);
      setTags(newTags);
      syncToVariable(newOptions, newTags, false, { query: searchQuery, options: searchOptions });
    },
    [variable, options, tags, searchQuery, searchOptions, syncToVariable]
  );

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  const handleQueryChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const q = evt.target.value;
      setSearchQuery(q);
      setHighlightIndex(-1);
      const filtered = options
        .filter(o => o.text.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 1000);
      setSearchOptions(filtered);
    },
    [options]
  );

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.keyCode === 27) {
        setDropdownVisible(false);
      }
      if (evt.keyCode === 40) {
        setHighlightIndex(i => (i + 1) % searchOptions.length);
      }
      if (evt.keyCode === 38) {
        setHighlightIndex(i => (i - 1 + searchOptions.length) % searchOptions.length);
      }
      if (evt.keyCode === 13) {
        if (searchOptions.length === 0) {
          syncToVariable(options, tags, true, { query: searchQuery, options: searchOptions });
        } else {
          selectValue(searchOptions[highlightIndex], {}, true, false);
        }
      }
      if (evt.keyCode === 32) {
        selectValue(searchOptions[highlightIndex], {}, false, false);
      }
    },
    [searchOptions, highlightIndex, options, tags, searchQuery, selectValue, syncToVariable]
  );

  // -------------------------------------------------------------------------
  // Outside-click to commit
  // -------------------------------------------------------------------------

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownVisible) return;

    const handleBodyClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        syncToVariable(options, tags, true, { query: searchQuery, options: searchOptions });
      }
    };

    document.body.addEventListener('click', handleBodyClick);
    return () => document.body.removeEventListener('click', handleBodyClick);
  }, [dropdownVisible, options, tags, searchQuery, searchOptions, syncToVariable]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="variable-link-wrapper" ref={containerRef}>
      {/* Link mode */}
      {!dropdownVisible && (
        <a onClick={show} className="variable-value-link">
          {linkText}
          {selectedTags.map(tag => (
            <span key={tag.text} title={tag.valuesText}>
              <span className="label-tag">
                &nbsp;&nbsp;<i className="fa fa-tag" />&nbsp;
                {tag.text}
              </span>
            </span>
          ))}
          <i className="fa fa-caret-down" style={{ fontSize: '12px' }} />
        </a>
      )}

      {/* Search input (shown when dropdown is open) */}
      {dropdownVisible && (
        <input
          ref={inputRef}
          type="text"
          className="gf-form-input"
          value={searchQuery}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
        />
      )}

      {/* Dropdown */}
      {dropdownVisible && (
        <div
          className={`variable-value-dropdown ${variable.multi ? 'multi' : 'single'}`}
        >
          <div className="variable-options-wrapper">
            {/* Options column */}
            <div className="variable-options-column">
              {variable.multi && (
                <a
                  className={`variable-options-column-header ${selectedValues.length > 1 ? 'many-selected' : ''}`}
                  title="Clear selections"
                  onClick={clearSelections}
                >
                  <span className="variable-option-icon" />
                  Selected ({selectedValues.length})
                </a>
              )}
              {searchOptions.map((option, idx) => (
                <a
                  key={String(option.value)}
                  className={`variable-option pointer ${option.selected ? 'selected' : ''} ${idx === highlightIndex ? 'highlighted' : ''}`}
                  onClick={e => selectValue(option, e as any)}
                >
                  <span className="variable-option-icon" />
                  <span>{option.text}</span>
                </a>
              ))}
            </div>

            {/* Tags column */}
            {tags.length > 0 && (
              <div className="variable-options-column">
                <div className="variable-options-column-header text-center">Tags</div>
                {tags.map(tag => (
                  <a
                    key={tag.text}
                    className={`variable-option-tag pointer ${tag.selected ? 'selected' : ''}`}
                    onClick={() => selectTag(tag)}
                  >
                    <span className="fa fa-fw variable-option-icon" />
                    <span className="label-tag">
                      {tag.text}&nbsp;&nbsp;<i className="fa fa-tag" />&nbsp;
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueSelectDropdown;
