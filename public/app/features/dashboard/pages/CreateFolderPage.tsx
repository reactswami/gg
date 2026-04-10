/**
 * CreateFolderPage
 *
 * React page replacing CreateFolderCtrl + create_folder.html.
 * Route: /dashboards/folder/new
 *
 * Ports the full controller: name validation (debounced), folder creation,
 * redirect to new folder URL on success.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import { useGiveFocus } from 'app/core/hooks/utilityHooks';
import locationUtil from 'app/core/utils/location_util';

const CreateFolderPage: React.FC = () => {
  const history       = useHistory();
  const backendSrv    = useAngularService<any>('backendSrv');
  const validationSrv = useAngularService<any>('validationSrv');
  const navModelSrv   = useAngularService<any>('navModelSrv');
  const emitAlert     = useEmitAppEvent('alert-success');

  const [navModel]            = useState(() => navModelSrv.getNav('dashboards', 'manage-dashboards', 0));
  const [title, setTitle]     = useState('');
  const [touched, setTouched] = useState(false);
  const [hasError, setHasError]         = useState(false);
  const [validationError, setError]     = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const inputRef = useGiveFocus<HTMLInputElement>(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Validate name with debounce (400ms, matching original) ───────────────

  const validate = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await validationSrv.validateNewFolderName(value);
        setHasError(false);
        setError(null);
      } catch (err: any) {
        setHasError(true);
        setError(err.message);
      }
    }, 400);
  }, [validationSrv]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setTouched(true);
    validate(value);
  }, [validate]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasError || !touched || submitting) return;

    setSubmitting(true);
    try {
      const result = await backendSrv.createFolder({ title });
      emitAlert(['Folder Created', 'OK']);
      history.push(locationUtil.stripBaseFromUrl(result.url));
    } finally {
      setSubmitting(false);
    }
  }, [hasError, touched, submitting, backendSrv, title, emitAlert, history]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader model={navModel} />

      <div className="page-container page-body">
        <h3 className="page-sub-heading">New Dashboard Folder</h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="gf-form-inline">
            <div className="gf-form gf-form--grow">
              <label className="gf-form-label width-10">Name</label>
              <input
                ref={inputRef}
                type="text"
                className={`gf-form-input${hasError ? ' validation-error' : ''}`}
                value={title}
                onChange={handleChange}
              />
              {touched && !hasError && (
                <label className="gf-form-label text-success">
                  <i className="fa fa-check" />
                </label>
              )}
            </div>
          </div>

          {hasError && (
            <div className="gf-form-inline">
              <div className="gf-form offset-width-10 gf-form--grow">
                <label className="gf-form-label text-warning gf-form-label--grow">
                  <i className="fa fa-warning" /> {validationError}
                </label>
              </div>
            </div>
          )}

          <div className="gf-form-button-row">
            <button
              type="submit"
              className="btn btn-success width-12"
              disabled={!touched || hasError || submitting}
            >
              <i className="fa fa-save" /> {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateFolderPage;
