/**
 * DashRepeatOption
 *
 * React port of dashRepeatOptionDirective (repeat_option/repeat_option.ts).
 * Renders a select for choosing which template variable drives panel repetition.
 *
 * Replaces Angular directive: <dash-repeat-option panel="...">
 */

import React, { useState, useEffect } from 'react';
import { useAngularService } from 'app/core/hooks/useAngularService';

interface Panel {
  repeat?: string;
  repeatDirection?: string;
}

export interface DashRepeatOptionProps {
  panel: Panel;
  onChange?: () => void;
}

const DashRepeatOption: React.FC<DashRepeatOptionProps> = ({ panel, onChange }) => {
  const variableSrv = useAngularService<any>('variableSrv');

  const [variables, setVariables] = useState<Array<{ text: string; value: string | null }>>([]);

  useEffect(() => {
    const vars = (variableSrv.variables || []).map((v: any) => ({
      text: v.name,
      value: v.name,
    }));

    if (vars.length === 0) {
      vars.unshift({ text: 'No template variables found', value: null });
    }

    vars.unshift({ text: 'Disabled', value: null });
    setVariables(vars);

    // If repeat is set but no direction, default to horizontal
    if (panel.repeat && !panel.repeatDirection) {
      panel.repeatDirection = 'h';
    }
  }, [variableSrv, panel]);

  const handleChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    panel.repeat = evt.target.value || undefined;
    if (panel.repeat) {
      panel.repeatDirection = 'h';
    }
    onChange?.();
  };

  return (
    <div className="gf-form-select-wrapper max-width-18" style={{ display: 'block', width: '100%' }}>
      <select
        className="gf-form-input"
        value={panel.repeat ?? ''}
        onChange={handleChange}
      >
        <option value="" />
        {variables.map((v, i) => (
          <option key={i} value={v.value ?? ''}>
            {v.text}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DashRepeatOption;
