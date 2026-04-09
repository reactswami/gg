/**
 * FolderPicker
 *
 * React port of FolderPickerCtrl + folder_picker.html.
 * Replaces Angular directive: <folder-picker>
 */

import React, { useState, useCallback, useEffect } from 'react';
import FormDropdown from 'app/core/components/FormDropdown/FormDropdown';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { useEmitAppEvent } from 'app/core/hooks/useAppEvents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FolderOption {
  id: number | null;
  title: string;
}

export interface FolderPickerProps {
  initialTitle?: string;
  initialFolderId?: number | null;
  labelClass?: string;
  enableCreateNew?: boolean;
  enableReset?: boolean;
  onChange: (folder: { id: number | null; title: string }) => void;
  onLoad?: (folder: { id: number | null; title: string }) => void;
  enterFolderCreation?: () => void;
  exitFolderCreation?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FolderPicker: React.FC<FolderPickerProps> = ({
  initialTitle = '',
  initialFolderId,
  labelClass = 'width-7',
  enableCreateNew = false,
  enableReset = false,
  onChange,
  onLoad,
  enterFolderCreation,
  exitFolderCreation,
}) => {
  const backendSrv    = useAngularService<any>('backendSrv');
  const validationSrv = useAngularService<any>('validationSrv');
  const contextSrv    = useAngularService<any>('contextSrv');
  const emitAlert     = useEmitAppEvent('alert-success');

  const isEditor  = contextSrv.isEditor;
  const ROOT_NAME = 'General';

  const [folder, setFolder]                       = useState<{ text: string; value: number | null } | null>(null);
  const [createMode, setCreateMode]               = useState(false);
  const [newFolderName, setNewFolderName]         = useState('');
  const [nameTouched, setNameTouched]             = useState(false);
  const [validationError, setValidationError]     = useState<string | null>(null);
  const [hasValidationError, setHasValidationError] = useState(false);

  // ── Load options from API ─────────────────────────────────────────────────

  const getOptions = useCallback(
    async (query: string) => {
      const params = { query, type: 'dash-folder', permission: 'Edit' };
      const result: any[] = await backendSrv.get('api/search', params);

      const options: Array<{ text: string; value: number | null }> = result.map(item => ({
        text: item.title,
        value: item.id,
      }));

      const q = query.toLowerCase();
      const showGeneral =
        isEditor &&
        (q === '' || 'general'.startsWith(q));

      if (showGeneral) {
        options.unshift({ text: ROOT_NAME, value: 0 });
      }

      if (isEditor && enableCreateNew && query === '') {
        options.unshift({ text: '-- New Folder --', value: -1 });
      }

      if (enableReset && query === '' && initialTitle !== '') {
        options.unshift({ text: initialTitle, value: null });
      }

      return options;
    },
    [backendSrv, isEditor, enableCreateNew, enableReset, initialTitle]
  );

  // ── Initial value resolution ──────────────────────────────────────────────

  useEffect(() => {
    getOptions('').then(options => {
      let selected: typeof options[0] | undefined;

      if (initialFolderId !== undefined && initialFolderId !== null) {
        selected = options.find(o => o.value === initialFolderId);
      } else if (enableReset && initialTitle && initialFolderId === null) {
        selected = { text: initialTitle, value: null };
      }

      if (!selected) {
        const userFolder = options.find(o => o.text === contextSrv.user.login);
        if (userFolder) {
          selected = userFolder;
        } else if (isEditor) {
          selected = { text: ROOT_NAME, value: 0 };
        } else {
          selected = options.length > 0 ? options[0] : { text: initialTitle, value: null };
        }
      }

      setFolder(selected);

      // Notify parent if value differs from initial
      if (selected.value !== initialFolderId) {
        onChange({ id: selected.value, title: selected.text });
        onLoad?.({ id: selected.value, title: selected.text });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Folder selection ──────────────────────────────────────────────────────

  const handleFolderChange = useCallback(
    (option: { text: string; value: string | number | null } | null) => {
      if (!option) {
        const defaultFolder = { text: ROOT_NAME, value: 0 as number | null };
        setFolder(defaultFolder);
        onChange({ id: 0, title: ROOT_NAME });
        return;
      }

      const numVal = option.value === null ? null : Number(option.value);

      if (numVal === -1) {
        // Enter folder creation mode
        setCreateMode(true);
        enterFolderCreation?.();
        return;
      }

      const selected = { text: option.text, value: numVal };
      setFolder(selected);
      onChange({ id: numVal, title: option.text });
    },
    [onChange, enterFolderCreation]
  );

  // ── New folder creation ───────────────────────────────────────────────────

  const handleNameChange = useCallback(
    async (evt: React.ChangeEvent<HTMLInputElement>) => {
      const name = evt.target.value;
      setNewFolderName(name);
      setNameTouched(true);

      try {
        await validationSrv.validateNewFolderName(name);
        setHasValidationError(false);
        setValidationError(null);
      } catch (err: any) {
        setHasValidationError(true);
        setValidationError(err.message);
      }
    },
    [validationSrv]
  );

  const handleCreateFolder = useCallback(
    async (evt: React.MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();

      const result = await backendSrv.createFolder({ title: newFolderName });
      emitAlert(['Folder Created', 'OK']);

      exitFolderCreation?.();
      setCreateMode(false);
      setHasValidationError(false);
      setValidationError(null);
      setNewFolderName('');
      setNameTouched(false);

      const newFolder = { text: result.title, value: result.id };
      setFolder(newFolder);
      onChange({ id: result.id, title: result.title });
    },
    [backendSrv, newFolderName, onChange, exitFolderCreation, emitAlert]
  );

  const handleCancelCreate = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();

      exitFolderCreation?.();
      setCreateMode(false);
      setHasValidationError(false);
      setValidationError(null);
      setNewFolderName('');
      setNameTouched(false);

      // Reload initial value
      if (folder) {
        onChange({ id: folder.value, title: folder.text });
      }
    },
    [folder, onChange, exitFolderCreation]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form">
          <label className={`gf-form-label ${labelClass}`}>Folder</label>

          {!createMode && folder && (
            <div className="dropdown">
              <FormDropdown
                model={folder}
                getOptions={getOptions as any}
                onChange={handleFolderChange as any}
              />
            </div>
          )}

          {createMode && (
            <input
              type="text"
              className="gf-form-input max-width-10"
              autoFocus
              value={newFolderName}
              onChange={handleNameChange}
            />
          )}
        </div>

        {createMode && (
          <>
            <div className="gf-form">
              <button
                className="btn btn-inverse"
                onClick={handleCreateFolder}
                disabled={!nameTouched || hasValidationError}
              >
                <i className="fa fa-fw fa-save" />&nbsp;Create
              </button>
            </div>
            <div className="gf-form">
              <button className="btn btn-inverse" onClick={handleCancelCreate}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {nameTouched && hasValidationError && (
        <div className="gf-form-inline">
          <div className="gf-form gf-form--grow">
            <label className="gf-form-label text-warning gf-form-label--grow">
              <i className="fa fa-warning" /> {validationError}
            </label>
          </div>
        </div>
      )}
    </>
  );
};

export default FolderPicker;
