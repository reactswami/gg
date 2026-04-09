/**
 * DashboardSubmenu
 *
 * React port of SubmenuCtrl + submenu.html.
 * Renders the template variable controls, annotation toggles and dashboard
 * links bar shown below the DashNav on a dashboard page.
 *
 * Replaces Angular directive: <dashboard-submenu dashboard="...">
 */

import React, { useState, useEffect, useCallback } from 'react';
import ValueSelectDropdown from 'app/core/components/ValueSelectDropdown/ValueSelectDropdown';
import { Switch } from 'app/core/components/Switch/Switch';
import { useAngularService } from 'app/core/hooks/useAngularService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateVariable {
  name: string;
  label?: string;
  hide: number;   // 0 = show, 1 = hide label, 2 = hide completely
  type: string;   // 'adhoc' | 'textbox' | 'query' | ...
  query: string;
  current: { value: any; text: string; tags?: any[] };
  options: any[];
  tags?: string[];
  multi: boolean;
  updateOptions?: () => void;
  getValuesForTag?: (tag: string) => Promise<string[]>;
}

interface Annotation {
  name: string;
  enable: boolean;
  hide?: boolean;
}

interface DashboardLink {
  title: string;
  url: string;
  type: string;
}

interface DashboardModel {
  annotations: { list: Annotation[] };
  links: DashboardLink[];
}

export interface DashboardSubmenuProps {
  dashboard: DashboardModel;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DashboardSubmenu: React.FC<DashboardSubmenuProps> = ({ dashboard }) => {
  const variableSrv = useAngularService<any>('variableSrv');

  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>(
    dashboard.annotations.list || []
  );

  // Load variables on mount and keep in sync with variableSrv
  useEffect(() => {
    setVariables(variableSrv.variables || []);
  }, [variableSrv]);

  const handleVariableUpdated = useCallback(
    (variable: TemplateVariable) => {
      variableSrv.variableUpdated(variable, true);
    },
    [variableSrv]
  );

  const handleTextboxKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLInputElement>, variable: TemplateVariable) => {
      if (evt.key === 'Enter') {
        if (variable.current.value !== variable.query) {
          variable.updateOptions?.();
          handleVariableUpdated(variable);
        }
      }
    },
    [handleVariableUpdated]
  );

  const handleTextboxBlur = useCallback(
    (evt: React.FocusEvent<HTMLInputElement>, variable: TemplateVariable) => {
      if (variable.current.value !== variable.query) {
        variable.updateOptions?.();
        handleVariableUpdated(variable);
      }
    },
    [handleVariableUpdated]
  );

  const handleAnnotationToggle = useCallback(
    (annotation: Annotation) => {
      setAnnotations(prev =>
        prev.map(a =>
          a === annotation ? { ...a, enable: !a.enable } : a
        )
      );
      // Sync back to dashboard model
      annotation.enable = !annotation.enable;
    },
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="submenu-controls">
      {/* Template variables */}
      {variables.map((variable, idx) => {
        if (variable.hide === 2) return null;

        return (
          <div key={idx} className="submenu-item gf-form-inline">
            <div className="gf-form">
              {variable.hide !== 1 && (
                <label className="gf-form-label template-variable">
                  {variable.label || variable.name}
                </label>
              )}

              {variable.type !== 'adhoc' && variable.type !== 'textbox' && (
                <ValueSelectDropdown
                  variable={variable as any}
                  onUpdated={() => handleVariableUpdated(variable)}
                />
              )}

              {variable.type === 'textbox' && (
                <input
                  type="text"
                  className="gf-form-input width-12"
                  value={variable.query}
                  onChange={e => {
                    variable.query = e.target.value;
                    setVariables([...variables]);
                  }}
                  onBlur={e => handleTextboxBlur(e, variable)}
                  onKeyDown={e => handleTextboxKeyDown(e, variable)}
                />
              )}

              {/* adhoc filters: still Angular — bridge-wrap when available */}
              {variable.type === 'adhoc' && (
                <ad-hoc-filters-wrapper variable={variable} />
              )}
            </div>
          </div>
        );
      })}

      {/* Annotation toggles */}
      {annotations.length > 0 && (
        <div>
          {annotations
            .filter(a => !a.hide)
            .map((annotation, idx) => (
              <div
                key={idx}
                className={`submenu-item ${!annotation.enable ? 'annotation-disabled' : ''}`}
              >
                <Switch
                  label={annotation.name}
                  checked={annotation.enable}
                  onChange={() => handleAnnotationToggle(annotation)}
                />
              </div>
            ))}
        </div>
      )}

      <div className="gf-form gf-form--grow" />

      {/* Dashboard links — still Angular directive, bridge-wrapped */}
      {dashboard.links.length > 0 && (
        <dash-links-container-wrapper
          links={dashboard.links}
          dashboard={dashboard}
        />
      )}

      <div className="clearfix" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stub declarations for Angular children not yet migrated
// ---------------------------------------------------------------------------

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ad-hoc-filters-wrapper': any;
      'dash-links-container-wrapper': any;
    }
  }
}

export default DashboardSubmenu;
