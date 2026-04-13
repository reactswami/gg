/**
 * DashLinksEditor
 *
 * React port of DashLinkEditorCtrl + editor.html.
 * Replaces Angular directive: <dash-links-editor dashboard="...">
 *
 * Used inside DashboardSettings Links tab.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Switch } from 'app/core/components/Switch/Switch';
import TagsInput from 'app/core/components/TagsInput/TagsInput';
import { useTagColor } from 'app/core/components/TagsInput/TagsInput';
import { useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import _ from 'lodash';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, string> = {
  'external link': 'fa-external-link',
  dashboard: 'fa-th-large',
  question: 'fa-question',
  info: 'fa-info',
  bolt: 'fa-bolt',
  doc: 'fa-file-text-o',
  cloud: 'fa-cloud',
};

interface DashLink {
  type: 'dashboards' | 'link';
  title?: string;
  url?: string;
  tooltip?: string;
  icon?: string;
  tags?: string[];
  asDropdown?: boolean;
  keepTime?: boolean;
  includeVars?: boolean;
  targetBlank?: boolean;
}

interface DashboardModel {
  links: DashLink[];
}

export interface DashLinksEditorProps {
  dashboard: DashboardModel;
}

// ---------------------------------------------------------------------------
// Tag badge (coloured) - replaces tag-color-from-name directive inline
// ---------------------------------------------------------------------------

const TagBadge: React.FC<{ name: string }> = ({ name }) => {
  const style = useTagColor(name);
  return <span className="label label-tag" style={{ ...style, marginRight: 6 }}>{name}</span>;
};

// ---------------------------------------------------------------------------
// LinkForm - edit/new form
// ---------------------------------------------------------------------------

interface LinkFormProps {
  link: DashLink;
  mode: 'new' | 'edit';
  onSave: (link: DashLink) => void;
  onCancel: () => void;
}

const LinkForm: React.FC<LinkFormProps> = ({ link: initial, mode, onSave, onCancel }) => {
  const [link, setLink] = useState<DashLink>({ ...initial });

  const update = (patch: Partial<DashLink>) => setLink(l => ({ ...l, ...patch }));

  return (
    <div className="gf-form-group">
      <div className="gf-form-group">
        {/* Type */}
        <div className="gf-form">
          <span className="gf-form-label width-8">Type</span>
          <div className="gf-form-select-wrapper width-10">
            <select
              className="gf-form-input"
              value={link.type}
              onChange={e => update({ type: e.target.value as DashLink['type'] })}
            >
              <option value="dashboards">dashboards</option>
              <option value="link">link</option>
            </select>
          </div>
        </div>

        {/* Dashboards type fields */}
        {link.type === 'dashboards' && (
          <>
            <div className="gf-form">
              <span className="gf-form-label width-8">With tags</span>
              <TagsInput
                value={link.tags || []}
                onChange={tags => update({ tags })}
                placeholder="add tags"
              />
            </div>
            <Switch
              label="As dropdown"
              checked={!!link.asDropdown}
              onChange={() => update({ asDropdown: !link.asDropdown })}
              labelClass="width-8"
              switchClass="max-width-4"
            />
            {link.asDropdown && (
              <div className="gf-form">
                <span className="gf-form-label width-8">Title</span>
                <input
                  type="text"
                  className="gf-form-input max-width-10"
                  value={link.title || ''}
                  onChange={e => update({ title: e.target.value })}
                />
              </div>
            )}
          </>
        )}

        {/* Link type fields */}
        {link.type === 'link' && (
          <>
            <div className="gf-form">
              <span className="gf-form-label width-8">URL</span>
              <input
                type="text"
                className="gf-form-input width-20"
                value={link.url || ''}
                onChange={e => update({ url: e.target.value })}
              />
            </div>
            <div className="gf-form">
              <span className="gf-form-label width-8">Title</span>
              <input
                type="text"
                className="gf-form-input width-20"
                value={link.title || ''}
                onChange={e => update({ title: e.target.value })}
              />
            </div>
            <div className="gf-form">
              <span className="gf-form-label width-8">Tooltip</span>
              <input
                type="text"
                className="gf-form-input width-20"
                placeholder="Open dashboard"
                value={link.tooltip || ''}
                onChange={e => update({ tooltip: e.target.value })}
              />
            </div>
            <div className="gf-form">
              <span className="gf-form-label width-8">Icon</span>
              <div className="gf-form-select-wrapper width-20">
                <select
                  className="gf-form-input"
                  value={link.icon || 'external link'}
                  onChange={e => update({ icon: e.target.value })}
                >
                  {Object.keys(ICON_MAP).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Include options */}
      <div className="gf-form-group">
        <h5 className="section-heading">Include</h5>
        <Switch label="Time range" checked={!!link.keepTime} onChange={() => update({ keepTime: !link.keepTime })} labelClass="width-9" switchClass="max-width-6" />
        <Switch label="Variable values" checked={!!link.includeVars} onChange={() => update({ includeVars: !link.includeVars })} labelClass="width-9" switchClass="max-width-6" />
        <Switch label="Open in new tab" checked={!!link.targetBlank} onChange={() => update({ targetBlank: !link.targetBlank })} labelClass="width-9" switchClass="max-width-6" />
      </div>

      <button className="btn btn-success" onClick={() => onSave(link)}>
        {mode === 'new' ? 'Add' : 'Update'}
      </button>
      <button className="btn btn-inverse" style={{ marginLeft: 8 }} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DashLinksEditor
// ---------------------------------------------------------------------------

const DashLinksEditor: React.FC<DashLinksEditorProps> = ({ dashboard }) => {
  const emitLinksUpdated = useEmitAppEvent('dash-links-updated');
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list');
  const [editingLink, setEditingLink] = useState<DashLink | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [links, setLinks] = useState<DashLink[]>(dashboard.links || []);

  // Emit event when unmounting (matching Angular $destroy behaviour)
  useEffect(() => {
    return () => emitLinksUpdated();
  }, [emitLinksUpdated]);

  // Keep dashboard.links in sync
  useEffect(() => {
    dashboard.links = links;
  }, [links, dashboard]);

  const setupNew = useCallback(() => {
    setEditingLink({ type: 'dashboards', icon: 'external link' });
    setMode('new');
  }, []);

  const editLink = useCallback((link: DashLink, idx: number) => {
    setEditingLink({ ...link });
    setEditingIndex(idx);
    setMode('edit');
  }, []);

  const handleSave = useCallback((link: DashLink) => {
    if (mode === 'new') {
      setLinks(prev => [...prev, link]);
    } else {
      setLinks(prev => prev.map((l, i) => i === editingIndex ? link : l));
    }
    setMode('list');
    setEditingLink(null);
  }, [mode, editingIndex]);

  const deleteLink = useCallback((idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const moveLink = useCallback((idx: number, dir: number) => {
    setLinks(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  // -- Render ----------------------------------------------------------------

  return (
    <div>
      <h3 className="dashboard-settings__header">
        <a onClick={() => setMode('list')}>Dashboard Links</a>
        {mode === 'new' && <span> &gt; New</span>}
        {mode === 'edit' && <span> &gt; Edit</span>}
      </h3>

      {mode === 'list' && (
        <>
          {links.length === 0 ? (
            <div className="empty-list-cta">
              <div className="empty-list-cta__title">There are no dashboard links added yet</div>
              <a className="empty-list-cta__button btn btn-xlarge btn-success" onClick={setupNew}>
                <i className="gicon gicon-add-link" /> Add Dashboard Link
              </a>
              <div className="grafana-info-box">
                <h5>What are Dashboard Links?</h5>
                <p>Dashboard Links allow you to place links to other dashboards and web sites directly below the dashboard header.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="page-action-bar">
                <div className="page-action-bar__spacer" />
                <button type="button" className="btn btn-success" onClick={setupNew}>
                  <i className="fa fa-plus" /> New
                </button>
              </div>
              <table className="filter-table filter-table--hover">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Info</th>
                    <th colSpan={3} />
                  </tr>
                </thead>
                <tbody>
                  {links.map((link, idx) => (
                    <tr key={idx}>
                      <td className="pointer" onClick={() => editLink(link, idx)}>
                        <i className="fa fa-fw fa-external-link" /> {link.type}
                      </td>
                      <td>
                        {link.title && <div>{link.title}</div>}
                        {!link.title && link.url && <div>{link.url}</div>}
                        {!link.title && link.tags && link.tags.map(tag => <TagBadge key={tag} name={tag} />)}
                      </td>
                      <td style={{ width: '1%' }}>
                        {idx > 0 && <i className="pointer fa fa-arrow-up" onClick={() => moveLink(idx, -1)} />}
                      </td>
                      <td style={{ width: '1%' }}>
                        {idx < links.length - 1 && <i className="pointer fa fa-arrow-down" onClick={() => moveLink(idx, 1)} />}
                      </td>
                      <td style={{ width: '1%' }}>
                        <a className="btn btn-danger btn-mini" onClick={() => deleteLink(idx)}>
                          <i className="fa fa-remove" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      {(mode === 'new' || mode === 'edit') && editingLink && (
        <LinkForm
          link={editingLink}
          mode={mode}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditingLink(null); }}
        />
      )}
    </div>
  );
};

export default DashLinksEditor;
