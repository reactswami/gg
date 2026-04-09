import React, { useCallback } from 'react';
import classNames from 'classnames';
import { TagBadge } from '../TagFilter/TagBadge';

// ---------------------------------------------------------------------------
// Types (mirroring the shape built by SearchSrv)
// ---------------------------------------------------------------------------

export interface SearchItem {
  id: number;
  uid: string;
  title: string;
  url: string;
  type: string;
  tags: string[];
  folderTitle?: string;
  folderUrl?: string;
  selected?: boolean;
  checked?: boolean;
  owner?: string;
  access?: string;
}

export interface SearchSection {
  id: number | string;
  uid?: string;
  title: string;
  icon: string;
  url?: string;
  expanded: boolean;
  hideHeader?: boolean;
  selected?: boolean;
  checked?: boolean;
  items: SearchItem[];
  toggle: (section: SearchSection) => Promise<SearchSection>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchResultItemProps {
  item: SearchItem;
  editable?: boolean;
  isTemplate?: boolean;
  onTagSelected: (tag: string) => void;
  onToggleSelection?: (item: SearchItem) => void;
  onEditSelected?: (item: SearchItem) => void;
  getIcon?: (item: SearchItem) => string;
  onHideMenu: () => void;
}

interface SearchResultSectionProps {
  section: SearchSection;
  editable?: boolean;
  isTemplate?: boolean;
  onTagSelected: (tag: string) => void;
  onFolderExpanding?: () => void;
  onToggleSelection?: (item: SearchItem | SearchSection) => void;
  onEditSelected?: (item: SearchItem) => void;
  getIcon?: (item: SearchItem) => string;
  onHideMenu: () => void;
}

export interface SearchResultsProps {
  results: SearchSection[];
  editable?: boolean;
  isTemplate?: boolean;
  selectedFolderId?: number;
  onTagSelected: (tag: string) => void;
  onFolderExpanding?: () => void;
  onToggleSelection?: (item: SearchItem | SearchSection) => void;
  onEditSelected?: (item: SearchItem) => void;
  getIcon?: (item: SearchItem) => string;
  onHideMenu: () => void;
  onShowAllFolders?: () => void;
}

// ---------------------------------------------------------------------------
// SearchResultItem
// ---------------------------------------------------------------------------

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  item,
  editable,
  isTemplate,
  onTagSelected,
  onToggleSelection,
  onEditSelected,
  getIcon,
  onHideMenu,
}) => {
  const handleTagClick = useCallback(
    (tag: string, evt: React.MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
      onTagSelected(tag);
    },
    [onTagSelected]
  );

  const handleEditClick = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      onEditSelected?.(item);
    },
    [item, onEditSelected]
  );

  const handleCheckboxClick = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
      onToggleSelection?.(item);
    },
    [item, onToggleSelection]
  );

  const iconSrc = isTemplate && getIcon ? getIcon(item) : null;

  return (
    <a
      className={classNames('search-item', 'search-item--indent', { selected: item.selected })}
      onClick={onHideMenu}
      href={item.url}
    >
      {editable && (
        <div onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={!!item.checked}
            onChange={() => {}}
            className="gf-form-switch--transparent gf-form-switch--search-result__item"
          />
        </div>
      )}

      <span className="search-item__icon">
        {iconSrc ? (
          <img src={iconSrc} height="24px" width="24px" alt="" />
        ) : (
          <i className="gicon mini gicon-dashboard-list" />
        )}
      </span>

      <span
        className="search-item__body"
        onClick={isTemplate ? handleEditClick : undefined}
      >
        <div className="search-item__body-title">{item.title}</div>
        <span className="search-item__body-folder-title" title={item.folderTitle}>
          {item.folderTitle}
        </span>
      </span>

      {isTemplate && (
        <>
          <span className="search-item__properties">
            <div className="template-label">
              Owner: <span className="template-value">{item.owner}</span>
            </div>
          </span>
          <span>
            <div className="template-label">
              Visibility: <span className="template-value">{item.access}</span>
            </div>
          </span>
        </>
      )}

      <span className="search-item__tags">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="label label-tag"
            onClick={(e) => handleTagClick(tag, e)}
          >
            <TagBadge label={tag} removeIcon={false} count={0} onClick={() => onTagSelected(tag)} />
          </span>
        ))}
      </span>
    </a>
  );
};

// ---------------------------------------------------------------------------
// SearchResultSection
// ---------------------------------------------------------------------------

const SearchResultSection: React.FC<SearchResultSectionProps> = ({
  section,
  editable,
  isTemplate,
  onTagSelected,
  onFolderExpanding,
  onToggleSelection,
  onEditSelected,
  getIcon,
  onHideMenu,
}) => {
  const handleToggleExpand = useCallback(() => {
    if (!section.expanded && onFolderExpanding) {
      onFolderExpanding();
    }
    section.toggle(section);
  }, [section, onFolderExpanding]);

  const handleToggleSelection = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      onToggleSelection?.(section);
    },
    [section, onToggleSelection]
  );

  const isStatseekerDefault = section.uid?.indexOf('StatseekerDefault') === 0;

  return (
    <div className="search-section">
      {!section.hideHeader && (
        <div
          className={classNames('search-section__header', 'pointer', {
            selected: section.selected,
          })}
          onClick={handleToggleExpand}
        >
          {editable && !isStatseekerDefault && (
            <div onClick={handleToggleSelection}>
              <input
                type="checkbox"
                checked={!!section.checked}
                onChange={() => {}}
                className="gf-form-switch--transparent gf-form-switch--search-result__section"
              />
            </div>
          )}

          <i className={classNames('search-section__header__icon', section.icon)} />
          <span className="search-section__header__text">{section.title}</span>

          {section.url && !isStatseekerDefault && (
            <a
              href={section.url}
              className="search-section__header__link"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fa fa-cog" />
            </a>
          )}

          <i
            className={classNames('search-section__header__toggle', {
              'fa fa-angle-down': section.expanded,
              'fa fa-angle-right': !section.expanded,
            })}
          />
        </div>
      )}

      {section.hideHeader && <div className="search-section__header" />}

      {section.expanded && (
        <div>
          {section.items.map((item) => (
            <SearchResultItem
              key={item.id}
              item={item}
              editable={editable}
              isTemplate={isTemplate}
              onTagSelected={onTagSelected}
              onToggleSelection={onToggleSelection}
              onEditSelected={onEditSelected}
              getIcon={getIcon}
              onHideMenu={onHideMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SearchResults (top-level, replaces dashboard-search-results directive)
// ---------------------------------------------------------------------------

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  editable,
  isTemplate,
  selectedFolderId,
  onTagSelected,
  onFolderExpanding,
  onToggleSelection,
  onEditSelected,
  getIcon,
  onHideMenu,
  onShowAllFolders,
}) => {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <>
      {results.map((section) => (
        <SearchResultSection
          key={section.id}
          section={section}
          editable={editable}
          isTemplate={isTemplate}
          onTagSelected={onTagSelected}
          onFolderExpanding={onFolderExpanding}
          onToggleSelection={onToggleSelection}
          onEditSelected={onEditSelected}
          getIcon={getIcon}
          onHideMenu={onHideMenu}
        />
      ))}

      {selectedFolderId && (
        <button className="search-section__show-all-button" onClick={onShowAllFolders}>
          <span className="search-section__header__icon">
            <i className="gicon gicon-alert-rules" />
          </span>
          <div className="search-section__header">Show all folders</div>
        </button>
      )}
    </>
  );
};

export default SearchResults;
