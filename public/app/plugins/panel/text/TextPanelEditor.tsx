/**
 * TextPanelEditor
 *
 * React options panel for the text plugin, replacing editor.html.
 * Shown in the panel editor sidebar when the text panel is in edit mode.
 *
 * Export name PanelOptionsComponent is required by PanelEditor.
 */

import React from 'react';
import { PanelOptionsProps } from 'app/types';
import CodeEditor from 'app/core/components/CodeEditor/CodeEditor';

interface TextOptions {
  mode: 'markdown' | 'html' | 'link' | 'text';
  content: string;
}

const MODES: TextOptions['mode'][] = ['html', 'link', 'markdown'];

export const TextPanelEditor: React.FC<PanelOptionsProps<TextOptions>> = ({ options, onChange }) => {
  const mode    = options?.mode    ?? 'markdown';
  const content = options?.content ?? '';

  const update = (patch: Partial<TextOptions>) => onChange({ ...options, ...patch });

  return (
    <div>
      {/* Mode selector */}
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <span className="gf-form-label">Mode</span>
            <span className="gf-form-select-wrapper">
              <select
                className="gf-form-input"
                value={mode}
                onChange={e => update({ mode: e.target.value as TextOptions['mode'] })}
              >
                {MODES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </span>
          </div>
        </div>
      </div>

      {/* Mode-specific hint */}
      <h3 className="page-heading">Content</h3>
      {mode === 'markdown' && (
        <span className="gf-form-label muted">
          Uses{' '}
          <a href="http://en.wikipedia.org/wiki/Markdown" target="_blank" rel="noopener noreferrer">
            Markdown
          </a>
          . HTML is not supported.
        </span>
      )}
      {mode === 'link' && (
        <span className="gf-form-label muted">
          Provide a URL for displaying external content. NOTE: The URL must allow loading from this domain.
        </span>
      )}

      {/* Content editor */}
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <CodeEditor
            content={content}
            mode={mode === 'markdown' ? 'markdown' : 'text'}
            maxLines={20}
            onChange={val => update({ content: val })}
          />
        </div>
      </div>
    </div>
  );
};

export { TextPanelEditor as PanelOptionsComponent };
