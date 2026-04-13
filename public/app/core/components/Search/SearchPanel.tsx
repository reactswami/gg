import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SearchResults, SearchSection } from './SearchResults';
import { TagFilter } from '../TagFilter/TagFilter';
import { useAppEvents, useEmitAppEvent } from 'app/core/hooks/useAppEvents';
import { useAngularService } from 'app/core/hooks/useAngularService';
import { SearchSrv } from 'app/core/services/search_srv';
import { contextSrv } from 'app/core/services/context_srv';
import { SearchOptions } from 'app/types/search';

// ---------------------------------------------------------------------------
// SearchPanel - replaces SearchCtrl + search.html
// ---------------------------------------------------------------------------

const INITIAL_QUERY: SearchOptions = {
  query: '',
  tag: [],
  starred: false,
};

const SearchPanel: React.FC = () => {
  const searchSrv = useAngularService<SearchSrv>('searchSrv');

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchTabFocused, setIsSearchTabFocused] = useState(false);
  const [results, setResults] = useState<SearchSection[]>([]);
  const [query, setQuery] = useState<SearchOptions>({ ...INITIAL_QUERY });
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  const isEditor = contextSrv.isEditor;
  const hasEditPermissionInFolders = contextSrv.hasEditPermissionInFolders;

  // -------------------------------------------------------------------------
  // appEvents integration
  // -------------------------------------------------------------------------

  const emitHideSearch = useEmitAppEvent('hide-dash-search');

  useAppEvents('show-dash-search', (payload: { starred?: boolean; folderId?: number }) => {
    openSearch(payload);
  });

  useAppEvents('hide-dash-search', () => {
    closeSearch(true);
  });

  // -------------------------------------------------------------------------
  // Search logic
  // -------------------------------------------------------------------------

  const searchDashboards = useCallback(
    async (currentQuery: SearchOptions) => {
      setResults([]);
      setIsLoading(true);

      try {
        const found = await searchSrv.search(currentQuery);
        const sorted = (found || []).sort((a, b) => (a.score < b.score ? -1 : 1));
        setResults(sorted);
      } finally {
        setIsLoading(false);
      }
    },
    [searchSrv]
  );

  const openSearch = useCallback(
    async (payload?: { starred?: boolean; folderId?: number }) => {
      if (isOpen) {
        closeSearch(true);
        return;
      }

      const nextQuery: SearchOptions = { ...INITIAL_QUERY };

      if (payload?.starred) {
        nextQuery.starred = true;
      }

      let nextFolderId: number | undefined = undefined;
      if (payload?.folderId) {
        nextFolderId = payload.folderId;
        nextQuery.folderIds = [payload.folderId];
      }

      setSelectedFolderId(nextFolderId);
      setQuery(nextQuery);
      setIsSearchTabFocused(true);
      setSelectedIndex(-1);
      setIsOpen(true);

      await searchDashboards(nextQuery);
    },
    [isOpen, searchDashboards]
  );

  const closeSearch = useCallback((force: boolean, target?: HTMLElement) => {
    if (force) {
      setIsOpen(false);
      return;
    }
    const backdrop = document.querySelector('.search-dropdown');
    if (target && target === backdrop) {
      setIsOpen(false);
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && isSearchTabFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isSearchTabFocused]);

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  const getFlattenedResults = useCallback(() => {
    let folderIndex = 0;
    return results.flatMap((section) => {
      const items: Array<{ folderIndex: number; dashboardIndex?: number }> = [{ folderIndex }];
      section.items?.forEach((_, dashboardIndex) => {
        items.push({ folderIndex, dashboardIndex });
      });
      folderIndex++;
      return items;
    });
  }, [results]);

  const moveSelection = useCallback(
    (direction: number, currentIndex: number) => {
      const flat = getFlattenedResults();
      if (flat.length === 0) {
        return currentIndex;
      }

      if (direction === 0) {
        return -1;
      }

      const max = flat.length;
      const newIndex = ((currentIndex + direction) % max + max) % max;
      return newIndex;
    },
    [getFlattenedResults]
  );

  const handleKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === 'Escape') {
        closeSearch(true);
      }
      if (evt.key === 'ArrowDown') {
        setSelectedIndex((idx) => moveSelection(1, idx));
      }
      if (evt.key === 'ArrowUp') {
        setSelectedIndex((idx) => moveSelection(-1, idx));
      }
    },
    [closeSearch, moveSelection]
  );

  // -------------------------------------------------------------------------
  // Query handlers
  // -------------------------------------------------------------------------

  const handleQueryChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const nextQuery = { ...query, query: evt.target.value };
      setQuery(nextQuery);
      setSelectedIndex(-1);
      searchDashboards(nextQuery);
    },
    [query, searchDashboards]
  );

  const handleTagFiltersChanged = useCallback(
    (tags: string[]) => {
      const nextQuery = { ...query, tag: tags };
      setQuery(nextQuery);
      setSelectedIndex(-1);
      searchDashboards(nextQuery);
    },
    [query, searchDashboards]
  );

  const handleShowStarred = useCallback(() => {
    const nextQuery = { ...query, starred: !query.starred };
    setQuery(nextQuery);
    setIsSearchTabFocused(true);
    setSelectedIndex(-1);
    searchDashboards(nextQuery);
  }, [query, searchDashboards]);

  const handleTagSelected = useCallback(
    (tag: string) => {
      if (!query.tag.includes(tag)) {
        const nextQuery = { ...query, tag: [...query.tag, tag] };
        setQuery(nextQuery);
        searchDashboards(nextQuery);
      }
    },
    [query, searchDashboards]
  );

  const handleClearFilter = useCallback(() => {
    const nextQuery = { ...query, tag: [] };
    setQuery(nextQuery);
    searchDashboards(nextQuery);
  }, [query, searchDashboards]);

  const handleShowAllFolders = useCallback(() => {
    setSelectedFolderId(undefined);
    const nextQuery = { ...query, folderIds: undefined };
    setQuery(nextQuery);
    searchDashboards(nextQuery);
  }, [query, searchDashboards]);

  const handleHideMenu = useCallback(() => {
    emitHideSearch();
  }, [emitHideSearch]);

  const getTags = useCallback(() => searchSrv.getDashboardTags(), [searchSrv]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="search-backdrop" />

      <div className="search-container">
        {/* Search field */}
        <div className="search-field-wrapper">
          <div className="search-field-icon pointer" onClick={() => closeSearch(true)}>
            <i className="fa fa-search" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="gf-form-input"
            placeholder="Find dashboards by name"
            tabIndex={1}
            spellCheck={false}
            value={query.query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
          />
          <div className="search-field-spacer" />
        </div>

        {/* Dropdown */}
        <div
          className="search-dropdown"
          onClick={(e) => closeSearch(false, e.target as HTMLElement)}
        >
          {/* Col 1 - results */}
          <div className="search-dropdown__col_1">
            <div className="search-results-scroller">
              <div className="search-results-container">
                {!isLoading && results.length === 0 && (
                  <h6>No dashboards matching your query were found.</h6>
                )}
                {isLoading && <h6>Loading your dashboards</h6>}
                {!isLoading && (
                  <SearchResults
                    results={results}
                    selectedFolderId={selectedFolderId}
                    onTagSelected={handleTagSelected}
                    onFolderExpanding={() => setSelectedIndex(moveSelection(0, selectedIndex))}
                    onHideMenu={handleHideMenu}
                    onShowAllFolders={handleShowAllFolders}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Col 2 - filters */}
          <div className="search-dropdown__col_2">
            <div className="search-filter-box" onClick={() => setIsSearchTabFocused(false)}>
              <div className="search-filter-box__header">
                <i className="fa fa-filter" />
                {' Filter by: '}
                <a className="pointer pull-right small" onClick={handleClearFilter}>
                  <i className="fa fa-remove" /> Clear
                </a>
              </div>
              <a
                className={`search-filter-box-link${query.starred ? ' selected' : ''}`}
                onClick={handleShowStarred}
              >
                <i className={`fa ${query.starred ? 'fa-star' : 'fa-star-o'}`} /> Starred
              </a>
              <TagFilter
                tags={query.tag}
                tagOptions={getTags}
                onChange={handleTagFiltersChanged}
              />
            </div>

            {(isEditor || hasEditPermissionInFolders) && (
              <div className="search-filter-box">
                <a href="dashboard/new" className="search-filter-box-link">
                  <i className="gicon gicon-dashboard-new" /> New dashboard
                </a>
                {isEditor && (
                  <a href="dashboards/folder/new" className="search-filter-box-link">
                    <i className="gicon gicon-folder-new" /> New folder
                  </a>
                )}
                {(isEditor || hasEditPermissionInFolders) && (
                  <>
                    <a href="dashboard/import" className="search-filter-box-link">
                      <i className="gicon gicon-dashboard-import" /> Import dashboard
                    </a>
                    <a href="template/import" className="search-filter-box-link">
                      <i className="gicon gicon-import-template" /> Import template
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPanel;
