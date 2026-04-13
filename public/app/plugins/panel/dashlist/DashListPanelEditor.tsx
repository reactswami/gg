/**
 * DashListPanelEditor
 *
 * React options panel for the dashlist plugin, replacing editor.html.
 * Uses FolderPicker and TagsInput (both already React).
 */

import React, { useCallback } from 'react';
import { PanelOptionsProps } from 'app/types';
import { Switch } from 'app/core/components/Switch/Switch';
import FolderPicker from 'app/features/dashboard/components/FolderPicker/FolderPicker';
import TagsInput from 'app/core/components/TagsInput/TagsInput';

interface DashListOptions {
  query: string;
  limit: number;
  tags: string[];
  recent: boolean;
  search: boolean;
  starred: boolean;
  headings: boolean;
  folderId: number | null;
}

export const DashListPanelEditor: React.FC<PanelOptionsProps<DashListOptions>> = ({
  options,
  onChange,
}) => {
  const opts: DashListOptions = {
    query: '',
    limit: 10,
    tags: [],
    recent: false,
    search: false,
    starred: true,
    headings: true,
    folderId: null,
    ...options,
  };

  const update = useCallback(
    (patch: Partial<DashListOptions>) => onChange({ ...opts, ...patch }),
    [opts, onChange]
  );

  return (
    <div>
      {/* Options section */}
      <div className="section gf-form-group">
        <h5 className="section-heading">Options</h5>

        <Switch
          label="Starred"
          labelClass="width-9"
          checked={opts.starred}
          onChange={() => update({ starred: !opts.starred })}
        />
        <Switch
          label="Recently viewed"
          labelClass="width-9"
          checked={opts.recent}
          onChange={() => update({ recent: !opts.recent })}
        />
        <Switch
          label="Search"
          labelClass="width-9"
          checked={opts.search}
          onChange={() => update({ search: !opts.search })}
        />
        <Switch
          label="Show headings"
          labelClass="width-9"
          checked={opts.headings}
          onChange={() => update({ headings: !opts.headings })}
        />

        <div className="gf-form">
          <span className="gf-form-label width-9">Max items</span>
          <input
            className="gf-form-input max-width-5"
            type="number"
            value={opts.limit}
            onChange={e => update({ limit: parseInt(e.target.value, 10) || 10 })}
          />
        </div>
      </div>

      {/* Search filters - only shown when search is enabled */}
      {opts.search && (
        <div className="section gf-form-group">
          <h5 className="section-heading">Search</h5>

          <div className="gf-form">
            <span className="gf-form-label width-6">Query</span>
            <input
              type="text"
              className="gf-form-input"
              placeholder="title query"
              value={opts.query}
              onChange={e => update({ query: e.target.value })}
            />
          </div>

          <FolderPicker
            initialFolderId={opts.folderId}
            initialTitle="All"
            labelClass="width-6"
            enableReset
            onChange={folder => update({ folderId: folder.id ?? null })}
          />

          <div className="gf-form">
            <span className="gf-form-label width-6">Tags</span>
            <TagsInput
              value={opts.tags}
              onChange={tags => update({ tags })}
              placeholder="add tags"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { DashListPanelEditor as PanelOptionsComponent };
