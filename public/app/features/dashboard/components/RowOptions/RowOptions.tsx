/**
 * RowOptions
 *
 * React port of RowOptionsCtrl + row_options.html.
 * Replaces Angular directive: <row-options row="..." on-updated="..." dismiss="...">
 *
 * Rendered inside the existing Angular modal system via DashboardRow.openSettings().
 * Once the modal system is migrated this can use a React modal directly.
 */

import React, { useState } from 'react';
import DashRepeatOption from '../DashRepeatOption/DashRepeatOption';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RowPanel {
  title: string;
  repeat?: string;
  repeatDirection?: string;
  getSaveModel?: () => any;
}

export interface RowOptionsProps {
  row: RowPanel;
  onUpdated: () => void;
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RowOptions: React.FC<RowOptionsProps> = ({ row, onUpdated, dismiss }) => {
  // Work on a local copy, matching Angular's $onInit which called getSaveModel()
  const [localRow, setLocalRow] = useState<RowPanel>(() =>
    row.getSaveModel ? row.getSaveModel() : { ...row }
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Write back to the source panel (same behaviour as RowOptionsCtrl.update)
    row.title = localRow.title;
    row.repeat = localRow.repeat;
    onUpdated();
    dismiss();
  };

  return (
    <div className="modal-body">
      <div className="modal-header">
        <h2 className="modal-header-title">
          <i className="fa fa-copy" />
          <span className="p-l-1">Row Options</span>
        </h2>
        <a className="modal-header-close" onClick={dismiss}>
          <i className="fa fa-remove" />
        </a>
      </div>

      <form
        onSubmit={handleSave}
        className="modal-content text-center"
      >
        <div className="section">
          <div className="gf-form">
            <span className="gf-form-label width-7">Title</span>
            <input
              type="text"
              className="gf-form-input max-width-13"
              value={localRow.title || ''}
              onChange={e => setLocalRow(r => ({ ...r, title: e.target.value }))}
            />
          </div>

          <div className="gf-form">
            <span className="gf-form-label width-7">Repeat for</span>
            <DashRepeatOption
              panel={localRow as any}
              onChange={() => setLocalRow(r => ({ ...r }))}
            />
          </div>

          <div className="gf-form-button-row">
            <button type="submit" className="btn btn-success">
              Update
            </button>
            <button type="button" className="btn btn-inverse" onClick={dismiss}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RowOptions;
