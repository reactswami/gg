/**
 * DashboardImportPage
 *
 * React page replacing DashboardImportCtrl + dashboard_import.html.
 * Routes: /dashboard/import  (and /template/import shares same component)
 *
 * Two-step flow:
 *   Step 1 - Paste JSON or upload file
 *   Step 2 - Configure options (name, folder, UID, datasource inputs) + import
 */

import React, { useState, useCallback, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import FolderPicker from 'app/features/dashboard/components/FolderPicker/FolderPicker';
import InfoPopover from 'app/core/components/InfoPopover/InfoPopover';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useGiveFocus } from 'app/core/hooks/utilityHooks';
import locationUtil from 'app/core/utils/location_util';
import _ from 'lodash';
import config from 'app/core/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashInput {
  name: string;
  label: string;
  info: string;
  value: string;
  type: 'datasource' | 'constant' | string;
  pluginId?: string;
  options?: Array<{ text: string; value: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DashboardImportPage: React.FC = () => {
  const history    = useHistory();
  const location   = useLocation();
  const backendSrv    = useAngularService<any>('backendSrv');
  const validationSrv = useAngularService<any>('validationSrv');
  const navModelSrv   = useAngularService<any>('navModelSrv');

  const searchParams = new URLSearchParams(location.search);

  const [navModel] = useState(() => navModelSrv.getNav('create', 'import'));
  const [step, setStep] = useState(1);
  const [jsonText, setJsonText]   = useState(searchParams.get('jsonText') || '');
  const [parseError, setParseError] = useState<string | null>(null);
  const [dash, setDash]   = useState<any>(null);
  const [inputs, setInputs] = useState<DashInput[]>([]);
  const [inputsValid, setInputsValid] = useState(true);
  const [folderId, setFolderId] = useState<number>(
    searchParams.get('folderId') ? Number(searchParams.get('folderId')) : null
  );
  const [initialFolderTitle] = useState('Select a folder');
  const [titleTouched, setTitleTouched] = useState(false);
  const [hasNameError, setHasNameError] = useState(false);
  const [nameError, setNameError]       = useState<string | null>(null);
  const [autoGenerateUid, setAutoGenerateUid] = useState(true);
  const [hasUidError, setHasUidError]         = useState(false);
  const [uidError, setUidError]               = useState<string | null>(null);
  const [inFolderCreation, setInFolderCreation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useGiveFocus<HTMLInputElement>(step === 2);
  const nameDebounce = useRef<ReturnType<typeof setTimeout>>();
  const uidDebounce  = useRef<ReturnType<typeof setTimeout>>();

  // -- Step 1: Load JSON ----------------------------------------------------

  const loadJsonText = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      onUpload(parsed);
    } catch {
      setParseError('Not valid JSON text');
    }
  }, [jsonText]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        onUpload(parsed);
      } catch {
        setParseError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }, []);

  const onUpload = useCallback((uploaded: any) => {
    const loadedDash = { ...uploaded, id: null };
    const loadedInputs: DashInput[] = [];

    for (const input of loadedDash.__inputs || []) {
      const model: DashInput = {
        name: input.name,
        label: input.label,
        info: input.description || 'Specify a string constant',
        value: input.value || '',
        type: input.type,
        pluginId: input.pluginId,
        options: [],
      };

      if (input.type === 'datasource') {
        model.value = 'Statseeker';
        const sources = _.filter(config.datasources, v => v.type === input.pluginId);
        model.info = sources.length === 0
          ? `No data sources of type ${input.pluginName} found`
          : `Select a ${input.pluginName} data source`;
        model.options = sources.map(v => ({ text: v.name, value: v.name }));
      }

      loadedInputs.push(model);
    }

    setDash(loadedDash);
    setInputs(loadedInputs);
    setInputsValid(loadedInputs.length === 0);
    setStep(2);
    validateTitle(loadedDash.title);
    validateUid(loadedDash.uid, true);
  }, []);

  // -- Validation -----------------------------------------------------------

  const validateTitle = useCallback((title: string) => {
    clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(async () => {
      setTitleTouched(true);
      try {
        await validationSrv.validateNewDashboardName(folderId, title);
        setHasNameError(false);
        setNameError(null);
      } catch (err: any) {
        setHasNameError(true);
        setNameError(err.message);
      }
    }, 300);
  }, [validationSrv, folderId]);

  const validateUid = useCallback((uid: string, initial = false) => {
    if (initial && uid) {
      // uid already set from file - mark as "value set" (not auto)
      return;
    }
    clearTimeout(uidDebounce.current);
    uidDebounce.current = setTimeout(async () => {
      try {
        const res = await backendSrv.getDashboardByUid(uid);
        setHasUidError(true);
        setUidError(`Dashboard named '${res.dashboard.title}' in folder '${res.meta.folderTitle}' has the same uid`);
      } catch {
        setHasUidError(false);
        setUidError(null);
      }
    }, 300);
  }, [backendSrv]);

  const handleInputChange = useCallback((idx: number, value: string) => {
    const updated = inputs.map((inp, i) => i === idx ? { ...inp, value } : inp);
    setInputs(updated);
    setInputsValid(updated.every(inp => !!inp.value));
  }, [inputs]);

  const handleFolderChange = useCallback((folder: { id: number; title: string }) => {
    setFolderId(folder.id);
  }, []);

  // -- Import ---------------------------------------------------------------

  const doImport = useCallback(async () => {
    if (!dash || hasNameError || hasUidError || inFolderCreation) return;
    setSubmitting(true);

    const inputsToBind = inputs.reduce((acc, input) => {
      acc[input.name] = input.value;
      return acc;
    }, {} as Record<string, string>);

    try {
      const result = await backendSrv.post('/api/dashboards/import', {
        dashboard: dash,
        overwrite: false,
        inputs: inputsToBind,
        folderId,
      });
      history.push(locationUtil.stripBaseFromUrl(result.importedUrl));
    } finally {
      setSubmitting(false);
    }
  }, [dash, hasNameError, hasUidError, inFolderCreation, inputs, folderId, backendSrv, history]);

  // -- Render ---------------------------------------------------------------

  return (
    <>
      <PageHeader model={navModel} />

      <div className="page-container page-body">

        {/* -- Step 1: Load JSON ------------------------------------------- */}
        {step === 1 && (
          <div className="gf-form-group">
            <p>
              A dashboard can be imported from a saved JSON file, or by pasting the
              dashboard JSON in the area below.
            </p>
            <div className="gf-form" style={{ marginBottom: 10 }}>
              <textarea
                rows={10}
                className="gf-form-input"
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
              />
            </div>
            <div className="page-action-bar">
              <label className="btn btn-secondary">
                <i className="fa fa-upload" /> Upload JSON file
                <input type="file" accept=".json" hidden onChange={handleFileUpload} />
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: 10 }}
                onClick={loadJsonText}
              >
                <i className="fa fa-paste" /> Load JSON Text
              </button>
              {parseError && (
                <span className="text-error p-l-1">
                  <i className="fa fa-warning" /> {parseError}
                </span>
              )}
            </div>
          </div>
        )}

        {/* -- Step 2: Configure options ------------------------------------ */}
        {step === 2 && dash && (
          <>
            <h3 className="section-heading">Options</h3>

            <div className="gf-form-group">
              {/* Name */}
              <div className="gf-form-inline">
                <div className="gf-form gf-form--grow">
                  <label className="gf-form-label width-15">Name</label>
                  <input
                    ref={titleRef}
                    type="text"
                    className={`gf-form-input${hasNameError ? ' validation-error' : ''}`}
                    value={dash.title}
                    onChange={e => {
                      setDash({ ...dash, title: e.target.value });
                      validateTitle(e.target.value);
                    }}
                  />
                  {titleTouched && !hasNameError && (
                    <label className="gf-form-label text-success"><i className="fa fa-check" /></label>
                  )}
                </div>
              </div>
              {hasNameError && (
                <div className="gf-form-inline">
                  <div className="gf-form offset-width-15 gf-form--grow">
                    <label className="gf-form-label text-warning gf-form-label--grow">
                      <i className="fa fa-warning" /> {nameError}
                    </label>
                  </div>
                </div>
              )}

              {/* Folder */}
              <div className="gf-form-inline">
                <div className="gf-form gf-form--grow">
                  <FolderPicker
                    labelClass="width-15"
                    initialFolderId={folderId}
                    initialTitle={initialFolderTitle}
                    onChange={handleFolderChange}
                    onLoad={handleFolderChange}
                    enterFolderCreation={() => setInFolderCreation(true)}
                    exitFolderCreation={() => setInFolderCreation(false)}
                    enableCreateNew
                  />
                </div>
              </div>

              {/* UID */}
              <div className="gf-form-inline">
                <div className="gf-form gf-form--grow">
                  <span className="gf-form-label width-15">
                    Unique identifier (uid)
                    <InfoPopover mode="right-normal">
                      The unique identifier (uid) of a dashboard can be used for uniquely identify a
                      dashboard between multiple installs.
                    </InfoPopover>
                  </span>
                  {autoGenerateUid ? (
                    <>
                      <input type="text" className="gf-form-input" disabled value="auto-generated" />
                      <button className="btn btn-secondary gf-form-btn" onClick={() => setAutoGenerateUid(false)}>
                        change
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="gf-form-input"
                        maxLength={40}
                        placeholder="optional, will be auto-generated if empty"
                        value={dash.uid || ''}
                        onChange={e => {
                          setDash({ ...dash, uid: e.target.value });
                          validateUid(e.target.value);
                        }}
                      />
                      {!hasUidError && (
                        <label className="gf-form-label text-success"><i className="fa fa-check" /></label>
                      )}
                    </>
                  )}
                </div>
              </div>
              {hasUidError && (
                <div className="gf-form-inline">
                  <div className="gf-form offset-width-15 gf-form--grow">
                    <label className="gf-form-label text-warning gf-form-label--grow">
                      <i className="fa fa-warning" /> {uidError}
                    </label>
                  </div>
                </div>
              )}

              {/* Datasource / constant inputs */}
              {inputs.map((input, idx) => (
                <div className="gf-form" key={input.name}>
                  <label className="gf-form-label width-15">
                    {input.label}
                    <InfoPopover mode="right-normal">{input.info}</InfoPopover>
                  </label>
                  {input.type === 'datasource' && input.options?.length ? (
                    <select
                      className="gf-form-input"
                      value={input.value}
                      onChange={e => handleInputChange(idx, e.target.value)}
                    >
                      {input.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.text}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="gf-form-input"
                      placeholder={input.value}
                      onChange={e => handleInputChange(idx, e.target.value)}
                    />
                  )}
                  {input.value && <label className="gf-form-label text-success"><i className="fa fa-check" /></label>}
                </div>
              ))}
            </div>

            <div className="gf-form-button-row">
              <button
                className="btn btn-primary"
                disabled={hasNameError || hasUidError || !inputsValid || inFolderCreation || submitting}
                onClick={doImport}
              >
                {submitting ? 'Importing-' : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardImportPage;
