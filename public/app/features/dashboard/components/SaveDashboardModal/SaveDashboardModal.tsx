/**
 * SaveDashboardModal
 *
 * React port of SaveDashboardModalCtrl + save_modal template.
 * Renders inside the existing Angular modal system via show-modal appEvent.
 *
 * Replaces Angular directive: <save-dashboard-modal dismiss="...">
 */

import React, { useState, useCallback, useRef } from 'react';
import { Switch } from 'app/core/components/Switch/Switch';
import { useGiveFocus } from 'app/core/hooks/utilityHooks';
import { useAngularService } from 'app/core/hooks/useAngularService';

export interface SaveDashboardModalProps {
  dismiss: () => void;
}

const MAX_MESSAGE_LENGTH = 64;

const SaveDashboardModal: React.FC<SaveDashboardModalProps> = ({ dismiss }) => {
  const dashboardSrv = useAngularService<any>('dashboardSrv');

  const dashboard = dashboardSrv.getCurrent();
  const timeChanged     = dashboard.hasTimeChanged?.() ?? false;
  const variableChanged = dashboard.hasVariableValuesChanged?.() ?? false;

  const [message, setMessage]             = useState('');
  const [saveTimerange, setSaveTimerange]  = useState(false);
  const [saveVariables, setSaveVariables]  = useState(false);
  const [isSaving, setIsSaving]            = useState(false);
  const [messageError, setMessageError]    = useState(false);

  const inputRef = useGiveFocus<HTMLInputElement>(true);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.length > MAX_MESSAGE_LENGTH) {
      setMessageError(true);
      return;
    }

    setIsSaving(true);

    const options = { saveVariables, saveTimerange, message };
    const saveModel = dashboard.getSaveModelClone(options);

    try {
      await dashboardSrv.save(saveModel, options);

      if (saveVariables) {
        dashboard.resetOriginalVariables?.();
      }
      if (saveTimerange) {
        dashboard.resetOriginalTime?.();
      }

      dismiss();
    } finally {
      setIsSaving(false);
    }
  }, [message, saveVariables, saveTimerange, dashboard, dashboardSrv, dismiss]);

  return (
    <div className="modal-body">
      <div className="modal-header">
        <h2 className="modal-header-title">
          <i className="fa fa-save" />
          <span className="p-l-1">Save changes</span>
        </h2>
        <a className="modal-header-close" onClick={dismiss}>
          <i className="fa fa-remove" />
        </a>
      </div>

      <form onSubmit={handleSave} className="modal-content">
        <div className="p-t-1">
          {(timeChanged || variableChanged) && (
            <div className="gf-form-group">
              {timeChanged && (
                <Switch
                  label="Save current time range"
                  checked={saveTimerange}
                  onChange={() => setSaveTimerange(v => !v)}
                  labelClass="width-12"
                  switchClass="max-width-6"
                />
              )}
              {variableChanged && (
                <Switch
                  label="Save current variables"
                  checked={saveVariables}
                  onChange={() => setSaveVariables(v => !v)}
                  labelClass="width-12"
                  switchClass="max-width-6"
                />
              )}
            </div>
          )}

          <div className="gf-form">
            <label className="gf-form-hint">
              <input
                ref={inputRef}
                type="text"
                name="message"
                className="gf-form-input"
                placeholder="Add a note to describe your changes…"
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                autoComplete="off"
                onChange={e => {
                  setMessage(e.target.value);
                  setMessageError(e.target.value.length > MAX_MESSAGE_LENGTH);
                }}
              />
              <small className="gf-form-hint-text muted">
                <span className={messageError ? 'text-error' : ''}>
                  {message.length}
                </span>
                {' / '}{MAX_MESSAGE_LENGTH} characters
              </small>
            </label>
          </div>
        </div>

        <div className="gf-form-button-row text-center">
          <button
            id="saveBtn"
            type="submit"
            className={`btn btn-success${isSaving ? ' btn-success--processing' : ''}`}
            disabled={messageError || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="btn btn-inverse" onClick={dismiss}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaveDashboardModal;
