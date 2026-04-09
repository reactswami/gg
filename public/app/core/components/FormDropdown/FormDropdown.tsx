/**
 * FormDropdown
 *
 * React port of FormDropdownCtrl (components/form_dropdown/form_dropdown.ts).
 * Replaces the jQuery/Bootstrap typeahead implementation with react-select.
 *
 * Replaces Angular directive: <gf-form-dropdown model="..." get-options="..." on-change="...">
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import _ from 'lodash';
import Select, { components, InputActionMeta, SingleValue } from 'react-select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormDropdownOption {
  text: string;
  value: string;
}

export interface FormDropdownProps {
  /** Current value — can be an option object or a raw string/value */
  model: FormDropdownOption | string | any;
  /** Returns available options (may be async) */
  getOptions: (query?: string) => Promise<FormDropdownOption[]> | FormDropdownOption[];
  /** Called when user selects / types a new value */
  onChange: (option: FormDropdownOption | null) => void;
  /** Extra CSS class on the trigger element */
  cssClass?: string;
  /** Allow free-text values not in the option list */
  allowCustom?: boolean;
  /** Render trigger as a label element instead of an input-style button */
  labelMode?: boolean;
  /** Whether to look up display text from options for the current model value */
  lookupText?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Open immediately on mount */
  startOpen?: boolean;
  /** Debounce option loading (ms) */
  debounce?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSelectOption(opt: FormDropdownOption) {
  return { label: opt.text, value: opt.value, original: opt };
}

function modelToText(model: any): string {
  if (model && typeof model === 'object') {
    return model.text || model.value || '';
  }
  return String(model ?? '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormDropdown: React.FC<FormDropdownProps> = ({
  model,
  getOptions,
  onChange,
  cssClass = '',
  allowCustom = false,
  labelMode = false,
  lookupText = false,
  placeholder = '',
  startOpen = false,
  debounce = 0,
}) => {
  const [isOpen, setIsOpen] = useState(startOpen);
  const [displayText, setDisplayText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<ReturnType<typeof toSelectOption>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const optionCacheRef = useRef<FormDropdownOption[]>([]);

  // -------------------------------------------------------------------------
  // Derive display text from model
  // -------------------------------------------------------------------------

  useEffect(() => {
    const raw = modelToText(model);

    if (lookupText && raw) {
      Promise.resolve(getOptions('')).then(opts => {
        const match = opts.find(o => o.value === model);
        setDisplayText(match ? match.text : raw);
      });
    } else if (model && typeof model === 'object' && model.text) {
      setDisplayText(model.text);
    } else {
      setDisplayText(raw);
    }
  }, [model, lookupText, getOptions]);

  // -------------------------------------------------------------------------
  // Load options (debounced if requested)
  // -------------------------------------------------------------------------

  const loadOptions = useCallback(
    _.debounce(async (query: string) => {
      setIsLoading(true);
      try {
        const raw = await Promise.resolve(getOptions(query));
        optionCacheRef.current = raw;

        const selectOpts = raw.map(toSelectOption);

        // Prepend current custom value if allowCustom and not already listed
        if (allowCustom && displayText && !raw.find(o => o.text === displayText)) {
          selectOpts.unshift({ label: displayText, value: displayText, original: { text: displayText, value: displayText } });
        }

        setOptions(selectOpts);
      } finally {
        setIsLoading(false);
      }
    }, debounce),
    [getOptions, allowCustom, displayText, debounce]
  );

  // Load options when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadOptions('');
    }
  }, [isOpen, loadOptions]);

  // -------------------------------------------------------------------------
  // Selection handler
  // -------------------------------------------------------------------------

  const handleChange = useCallback(
    (selected: SingleValue<ReturnType<typeof toSelectOption>>) => {
      if (!selected) return;
      const opt = selected.original as FormDropdownOption;
      setDisplayText(opt.text);
      setIsOpen(false);
      onChange(opt);
    },
    [onChange]
  );

  // -------------------------------------------------------------------------
  // Input change — filter and support custom values
  // -------------------------------------------------------------------------

  const handleInputChange = useCallback(
    (value: string, { action }: InputActionMeta) => {
      if (action === 'input-change') {
        setInputValue(value);
        loadOptions(value);
      }
    },
    [loadOptions]
  );

  // -------------------------------------------------------------------------
  // Custom option creation for allowCustom mode
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (!allowCustom) return;
      if (evt.key === 'Enter' && inputValue) {
        const customOpt: FormDropdownOption = { text: inputValue, value: inputValue };
        setDisplayText(inputValue);
        setIsOpen(false);
        onChange(customOpt);
        evt.preventDefault();
      }
    },
    [allowCustom, inputValue, onChange]
  );

  // -------------------------------------------------------------------------
  // Trigger (link button) — click to open
  // -------------------------------------------------------------------------

  const triggerClass = labelMode
    ? `gf-form-label ${cssClass}`
    : `gf-form-input gf-form-input--dropdown ${cssClass}`;

  if (!isOpen) {
    return (
      <a
        className={triggerClass}
        tabIndex={1}
        onClick={() => setIsOpen(true)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
        }}
        // Render HTML (for templateSrv.highlightVariablesAsHtml output)
        dangerouslySetInnerHTML={{ __html: displayText || '&nbsp;' }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Open state: render react-select
  // -------------------------------------------------------------------------

  const currentOption = options.find(o => o.label === displayText) ?? null;

  return (
    <Select
      autoFocus
      menuIsOpen
      isLoading={isLoading}
      options={options}
      value={currentOption}
      inputValue={inputValue}
      placeholder={placeholder || 'Select...'}
      onChange={handleChange}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={() => setIsOpen(false)}
      classNamePrefix="gf-form-dropdown"
      noOptionsMessage={() => (allowCustom ? 'Press Enter to use custom value' : 'No options')}
      styles={{
        container: base => ({ ...base, minWidth: 80 }),
        control: base => ({ ...base, borderRadius: 0 }),
      }}
    />
  );
};

export default FormDropdown;
