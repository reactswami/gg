/**
 * angular_wrappers.ts
 *
 * Registers React components as AngularJS directives so they can be used
 * in existing Angular templates during the migration.
 *
 * Migration status key:
 *   ✅ React-native — registered here so Angular templates can consume them
 *   🆕 Newly migrated this sprint
 *   ⏳ Planned
 */

import { react2AngularDirective } from 'app/core/bridge';

// ✅ Pre-existing React components
import PageHeader from './components/PageHeader/PageHeader';
import EmptyListCTA from './components/EmptyListCTA/EmptyListCTA';
import { SearchResult } from './components/search/SearchResult';
import { TagFilter } from './components/TagFilter/TagFilter';
import { Switch } from './components/Switch/Switch';
import { DeleteButton } from './components/DeleteButton/DeleteButton';
import { Tooltip } from './components/Tooltip/Tooltip';

// 🆕 Newly migrated this sprint
import Navbar from './components/Navbar/Navbar';
import SearchPanel from './components/Search/SearchPanel';
import SearchResults from './components/Search/SearchResults';

export function registerAngularDirectives() {
  // --- Core UI ---------------------------------------------------------------

  react2AngularDirective('pageHeader', PageHeader, ['model', 'noTabs']);
  react2AngularDirective('emptyListCta', EmptyListCTA, ['model']);
  react2AngularDirective('searchResult', SearchResult, []);
  react2AngularDirective('tagFilter', TagFilter, [
    'tags',
    ['onChange', { watchDepth: 'reference' }],
    ['tagOptions', { watchDepth: 'reference' }],
  ]);

  // --- Form controls ---------------------------------------------------------

  react2AngularDirective('gfFormSwitch', Switch, [
    'checked',
    ['onChange', { watchDepth: 'reference' }],
    'label',
    'labelClass',
    'switchClass',
    'transparent',
  ]);
  react2AngularDirective('deleteButton', DeleteButton, [
    ['onConfirm', { watchDepth: 'reference' }],
  ]);

  // --- Tooltip ---------------------------------------------------------------

  react2AngularDirective('infoTooltip', Tooltip, ['content', 'placement', 'className']);

  // --- 🆕 Navbar (replaces navbar.ts + navbar.html) -------------------------
  // Angular templates use: <navbar model="ctrl.navModel"></navbar>
  // The React Navbar internally renders SearchPanel (no more dashboard-search
  // directive needed in the navbar.html template).
  react2AngularDirective('navbar', Navbar, ['model']);

  // --- 🆕 Search (replaces search.ts + search.html) -------------------------
  // SearchPanel is self-contained: subscribes to appEvents show/hide-dash-search.
  // No props needed — drop it in once as a singleton in GrafanaCtrl's template.
  react2AngularDirective('searchPanel', SearchPanel, []);

  // --- 🆕 SearchResults (replaces dashboard-search-results directive) --------
  react2AngularDirective('searchResults', SearchResults, [
    'results',
    'editable',
    'isTemplate',
    ['onTagSelected', { watchDepth: 'reference' }],
    ['onFolderExpanding', { watchDepth: 'reference' }],
    ['onToggleSelection', { watchDepth: 'reference' }],
    ['onEditSelected', { watchDepth: 'reference' }],
    ['onHideMenu', { watchDepth: 'reference' }],
    ['onShowAllFolders', { watchDepth: 'reference' }],
    'selectedFolderId',
  ]);

  // ---------------------------------------------------------------------------
  // ⏳ Next up — add entries here as components are converted:
  //
  //   import ValueSelectDropdown from './components/ValueSelectDropdown/ValueSelectDropdown';
  //   react2AngularDirective('valueSelectDropdown', ValueSelectDropdown, [...]);
  // ---------------------------------------------------------------------------
}
