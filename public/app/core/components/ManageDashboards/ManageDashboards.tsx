/**
 * ManageDashboards
 *
 * React port of ManageDashboardsCtrl + manage_dashboards.html.
 * Replaces Angular directive: <manage-dashboards folder-id="..." folder-uid="...">
 *
 * Features: search, tag/starred filters, select-all, bulk delete, bulk move,
 * empty folder CTA.  Uses SearchResults (already React) for the list.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import _ from 'lodash';
import { SearchResults, SearchSection } from '../Search/SearchResults';
import EmptyListCTA from '../EmptyListCTA/EmptyListCTA';
import { Switch } from '../Switch/Switch';
import { useAngularService } from 'app/core/hooks/useAngularService';
import appEvents from 'app/core/app_events';
import { contextSrv } from 'app/core/services/context_srv';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TagOption {
  term: string;
  disabled?: boolean;
}

export interface ManageDashboardsProps {
  folderId?: number;
  folderUid?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isSelectableSection = (el: any) =>
  el.checked === true && el?.uid?.indexOf('StatseekerDefault') === -1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ManageDashboards: React.FC<ManageDashboardsProps> = ({ folderId, folderUid }) => {
  const backendSrv  = useAngularService<any>('backendSrv');
  const searchSrv   = useAngularService<any>('searchSrv');

  const isEditor                  = contextSrv.isEditor;
  const hasEditPermissionInFolders = contextSrv.hasEditPermissionInFolders;

  // ── State ────────────────────────────────────────────────────────────────

  const [queryText, setQueryText]     = useState('');
  const [queryTags, setQueryTags]     = useState<string[]>([]);
  const [queryStarred, setQueryStarred] = useState(false);
  const [sections, setSections]       = useState<SearchSection[]>([]);
  const [selectAll, setSelectAll]     = useState(false);
  const [canMove, setCanMove]         = useState(false);
  const [canDelete, setCanDelete]     = useState(false);
  const [canSave, setCanSave]         = useState(false);
  const [hasFilters, setHasFilters]   = useState(false);
  const [tagOptions, setTagOptions]   = useState<TagOption[]>([
    { term: 'Filter By Tag', disabled: true },
  ]);
  const [selectedTag, setSelectedTag]         = useState<TagOption>(tagOptions[0]);
  const [selectedStarred, setSelectedStarred] = useState('Filter by Starred');

  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // ── Search ────────────────────────────────────────────────────────────────

  const refreshList = useCallback(
    async (
      text = queryText,
      tags = queryTags,
      starred = queryStarred
    ) => {
      const query = {
        query: text,
        mode: 'tree',
        tag: tags,
        starred,
        skipRecent: true,
        skipStarred: true,
        folderIds: folderId ? [folderId] : [],
      };

      const result: SearchSection[] = await searchSrv.search(query);

      // Sort so StatseekerDefault folders come first
      const sorted = (result || []).sort((x: any, y: any) =>
        x.uid === 'StatseekerDefault' ? -1 : y.uid === 'StatseekerDefault' ? 1 : 0
      );

      // Init checkboxes
      for (const section of sorted) {
        (section as any).checked = false;
        for (const item of section.items || []) {
          (item as any).checked = false;
        }
      }

      // Hide header when scoped to a folder
      if (folderId && sorted.length > 0) {
        (sorted[0] as any).hideHeader = true;
      }

      setSections(sorted);
      setSelectAll(false);
      setCanMove(false);
      setCanDelete(false);
      setHasFilters(text.length > 0 || tags.length > 0 || starred);

      // Load folder permissions if scoped
      if (folderUid) {
        const folder = await backendSrv.getFolderByUid(folderUid);
        setCanSave(folder.canSave);
      }
    },
    [queryText, queryTags, queryStarred, folderId, folderUid, searchSrv, backendSrv]
  );

  // Initial load + tag filter init
  useEffect(() => {
    refreshList('', [], false).then(() => {
      searchSrv.getDashboardTags().then((results: any[]) => {
        setTagOptions([{ term: 'Filter By Tag', disabled: true }, ...results]);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced search ──────────────────────────────────────────────────────

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQueryText(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => refreshList(val, queryTags, queryStarred), 500);
  }, [refreshList, queryTags, queryStarred]);

  // ── Filter handlers ───────────────────────────────────────────────────────

  const filterByTag = useCallback((tag: string) => {
    if (!queryTags.includes(tag)) {
      const newTags = [...queryTags, tag];
      setQueryTags(newTags);
      refreshList(queryText, newTags, queryStarred);
    }
  }, [queryTags, queryText, queryStarred, refreshList]);

  const removeTag = useCallback((tag: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const newTags = queryTags.filter(t => t !== tag);
    setQueryTags(newTags);
    refreshList(queryText, newTags, queryStarred);
  }, [queryTags, queryText, queryStarred, refreshList]);

  const removeStarred = useCallback(() => {
    setQueryStarred(false);
    refreshList(queryText, queryTags, false);
  }, [queryText, queryTags, refreshList]);

  const clearFilters = useCallback(() => {
    setQueryText('');
    setQueryTags([]);
    setQueryStarred(false);
    refreshList('', [], false);
  }, [refreshList]);

  const handleTagFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = tagOptions.find(t => t.term === e.target.value);
    if (opt && !opt.disabled) {
      filterByTag(opt.term);
      setSelectedTag(tagOptions[0]);
    }
  }, [tagOptions, filterByTag]);

  const handleStarredFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStarred('Filter by Starred');
    const starred = val === 'Yes';
    setQueryStarred(starred);
    refreshList(queryText, queryTags, starred);
  }, [queryText, queryTags, refreshList]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const updateCanActions = useCallback((updatedSections: SearchSection[]) => {
    let dashCount = 0;
    let folderCount = 0;
    for (const section of updatedSections) {
      dashCount += (section.items || []).filter(isSelectableSection).length;
      if (isSelectableSection(section)) folderCount++;
    }
    setCanMove(dashCount > 0);
    setCanDelete(dashCount > 0 || folderCount > 0);
  }, []);

  const handleToggleSelection = useCallback((item: any) => {
    item.checked = !item.checked;
    if (item.items) {
      for (const sub of item.items) sub.checked = item.checked;
    }
    const updated = [...sections];
    setSections(updated);
    updateCanActions(updated);
  }, [sections, updateCanActions]);

  const handleSelectAll = useCallback(() => {
    const next = !selectAll;
    setSelectAll(next);
    const updated = sections.map(section => {
      if (!section.hideHeader) (section as any).checked = next;
      return { ...section, items: section.items.map(item => ({ ...item, checked: next })) };
    });
    setSections(updated);
    updateCanActions(updated);
  }, [selectAll, sections, updateCanActions]);

  // ── Bulk actions ──────────────────────────────────────────────────────────

  const getFoldersAndDashboards = useCallback(() => {
    const folders: string[] = [];
    const dashboards: string[] = [];
    for (const section of sections) {
      if ((section as any).checked && section.id !== 0 && (section as any).uid?.indexOf('StatseekerDefault') === -1) {
        folders.push((section as any).uid);
      } else {
        dashboards.push(...section.items.filter(isSelectableSection).map((i: any) => i.uid));
      }
    }
    return { folders, dashboards };
  }, [sections]);

  const handleDelete = useCallback(() => {
    const { folders, dashboards } = getFoldersAndDashboards();
    const fCount = folders.length;
    const dCount = dashboards.length;
    let text = 'Do you want to delete the ';
    let text2;
    if (fCount > 0 && dCount > 0) {
      text += `selected folder${fCount > 1 ? 's' : ''} and dashboard${dCount > 1 ? 's' : ''}?`;
      text2 = `All dashboards of the selected folder${fCount > 1 ? 's' : ''} will also be deleted`;
    } else if (fCount > 0) {
      text += `selected folder${fCount > 1 ? 's' : ''} and all its dashboards?`;
    } else {
      text += `selected dashboard${dCount > 1 ? 's' : ''}?`;
    }

    appEvents.emit('confirm-modal', {
      title: 'Delete', text, text2, icon: 'fa-trash', yesText: 'Delete',
      onConfirm: () => {
        backendSrv.deleteFoldersAndDashboards(folders, dashboards).then(() => refreshList());
      },
    });
  }, [getFoldersAndDashboards, backendSrv, refreshList]);

  const handleMoveTo = useCallback(() => {
    const dashboards = sections
      .flatMap(s => s.items.filter(isSelectableSection))
      .map((i: any) => i.uid);

    appEvents.emit('show-modal', {
      templateHtml:
        '<move-to-folder-modal dismiss="dismiss()" dashboards="model.dashboards" after-save="model.afterSave()"></move-to-folder-modal>',
      modalClass: 'modal--narrow',
      model: { dashboards, afterSave: refreshList },
    });
  }, [sections, refreshList]);

  // ── URLs ──────────────────────────────────────────────────────────────────

  const createDashUrl = folderId ? `dashboard/new?folderId=${folderId}` : 'dashboard/new';
  const importDashUrl = folderId ? `dashboard/import?folderId=${folderId}` : 'dashboard/import';

  const canCreate = hasEditPermissionInFolders || canSave;
  const hasResults = sections.length > 0;
  const showEmptyCta = canSave && folderId && !hasFilters && !hasResults;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-list">
      {/* ── Action bar ─────────────────────────────────────────────────────── */}
      {!(folderId && !hasFilters && !hasResults) && (
        <div className="page-action-bar page-action-bar--narrow">
          <label className="gf-form gf-form--grow gf-form--has-input-icon">
            <input
              type="text"
              className="gf-form-input max-width-30"
              placeholder="Find Dashboard by name"
              tabIndex={1}
              spellCheck={false}
              value={queryText}
              onChange={handleQueryChange}
            />
            <i className="gf-form-input-icon fa fa-search" />
          </label>
          <div className="page-action-bar__spacer" />
          {canCreate && (
            <a className="btn btn-success" href={createDashUrl}>
              <i className="fa fa-plus" /> Dashboard
            </a>
          )}
          {!folderId && isEditor && (
            <a className="btn btn-success" href="dashboards/folder/new">
              <i className="fa fa-plus" /> Folder
            </a>
          )}
          {canCreate && (
            <a className="btn btn-success" href={importDashUrl}>
              <i className="fa fa-plus" /> Import
            </a>
          )}
        </div>
      )}

      {/* ── Active filter pills ────────────────────────────────────────────── */}
      {hasFilters && (
        <div className="page-action-bar page-action-bar--narrow">
          <div className="gf-form-inline">
            {queryTags.length > 0 && (
              <div className="gf-form">
                <label className="gf-form-label width-4">Tags</label>
                <div className="gf-form-input gf-form-input--plaintext">
                  {queryTags.map(tag => (
                    <a
                      key={tag}
                      onClick={e => removeTag(tag, e)}
                      className="tag label label-tag"
                    >
                      <i className="fa fa-remove" />&nbsp;{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {queryStarred && (
              <div className="gf-form">
                <label className="gf-form-label">
                  <a className="pointer" onClick={removeStarred}>
                    <i className="fa fa-fw fa-check" /> Starred
                  </a>
                </label>
              </div>
            )}
            <div className="gf-form">
              <label className="gf-form-label">
                <a className="pointer" onClick={clearFilters} title="Clear current search query and filters">
                  <i className="fa fa-remove" />&nbsp;Clear
                </a>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty states ───────────────────────────────────────────────────── */}
      {hasFilters && !hasResults && (
        <div className="search-results">
          <em className="muted">No dashboards matching your query were found.</em>
        </div>
      )}
      {!folderId && !hasFilters && !hasResults && (
        <div className="search-results">
          <em className="muted">No dashboards found.</em>
        </div>
      )}

      {/* ── Results header row ─────────────────────────────────────────────── */}
      {hasResults && (
        <div className="search-results">
          <div className="search-results-filter-row">
            <Switch
              label=""
              checked={selectAll}
              onChange={handleSelectAll}
              switchClass="gf-form-switch--transparent gf-form-switch--search-result-filter-row__checkbox"
            />
            <div className="search-results-filter-row__filters">
              {!(canMove || canDelete) && (
                <>
                  <span className="gf-form-select-wrapper">
                    <select
                      className="search-results-filter-row__filters-item gf-form-input"
                      value={selectedTag.term}
                      onChange={handleTagFilterChange}
                    >
                      {tagOptions.map(opt => (
                        <option key={opt.term} value={opt.term} disabled={opt.disabled}>
                          {opt.term}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="gf-form-select-wrapper">
                    <select
                      className="search-results-filter-row__filters-item gf-form-input"
                      value={selectedStarred}
                      onChange={handleStarredFilterChange}
                    >
                      {['Filter by Starred', 'Yes', 'No'].map(opt => (
                        <option key={opt} value={opt} disabled={opt === 'Filter by Starred'}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </span>
                </>
              )}
              {(canMove || canDelete) && (
                <div className="gf-form-button-row">
                  <button
                    type="button"
                    className="btn gf-form-button btn-inverse"
                    disabled={!canMove}
                    onClick={handleMoveTo}
                    title={canMove ? '' : 'Select a dashboard to move (cannot move folders)'}
                  >
                    <i className="fa fa-exchange" />&nbsp;&nbsp;Move
                  </button>
                  <button
                    type="button"
                    className="btn gf-form-button btn-danger"
                    disabled={!canDelete}
                    onClick={handleDelete}
                  >
                    <i className="fa fa-trash" />&nbsp;&nbsp;Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Results list ───────────────────────────────────────────────────── */}
      <div className="search-results-container">
        <SearchResults
          results={sections}
          editable
          onTagSelected={filterByTag}
          onToggleSelection={handleToggleSelection}
          onHideMenu={() => {}}
        />
      </div>

      {/* ── Empty folder CTA ───────────────────────────────────────────────── */}
      {showEmptyCta && (
        <EmptyListCTA model={{
          title: "This folder doesn't have any dashboards yet",
          buttonIcon: 'gicon gicon-dashboard-new',
          buttonLink: createDashUrl,
          buttonTitle: 'Create Dashboard',
          proTip: 'Add/move dashboards to your folder at ->',
          proTipLink: 'dashboards',
          proTipLinkTitle: 'Manage dashboards',
          proTipTarget: '',
        }} />
      )}
    </div>
  );
};

export default ManageDashboards;

// Also export as named for the manage_dashboards_react import used in page components
export { ManageDashboards };
