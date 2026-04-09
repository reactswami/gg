/**
 * angular_wrappers.ts
 *
 * Central registry: registers React components as AngularJS directives so
 * existing Angular templates can consume them during the migration.
 *
 * Remove an entry once all .html template references to that directive are gone.
 */

import { react2AngularDirective } from 'app/core/bridge';

// ── Pre-existing React components ──────────────────────────────────────────
import PageHeader from './components/PageHeader/PageHeader';
import EmptyListCTA from './components/EmptyListCTA/EmptyListCTA';
import { SearchResult } from './components/search/SearchResult';
import { TagFilter } from './components/TagFilter/TagFilter';
import { Switch } from './components/Switch/Switch';
import { DeleteButton } from './components/DeleteButton/DeleteButton';
import { Tooltip } from './components/Tooltip/Tooltip';

// ── Sprint 2: Navbar + Search ──────────────────────────────────────────────
import Navbar from './components/Navbar/Navbar';
import SearchPanel from './components/Search/SearchPanel';
import SearchResults from './components/Search/SearchResults';

// ── Sprint 3: ValueSelectDropdown + FormDropdown + GrafanaAppRoot ──────────
import ValueSelectDropdown from './components/ValueSelectDropdown/ValueSelectDropdown';
import FormDropdown from './components/FormDropdown/FormDropdown';
import GrafanaAppRoot from './components/GrafanaApp/GrafanaAppRoot';

// ── Routing ────────────────────────────────────────────────────────────────
// AppRouterMount self-registers its directive on import — no react2AngularDirective needed
import 'app/routes/AppRouterMount';

export function registerAngularDirectives() {
  // ── Core UI ───────────────────────────────────────────────────────────────

  react2AngularDirective('pageHeader', PageHeader, ['model', 'noTabs']);
  react2AngularDirective('emptyListCta', EmptyListCTA, ['model']);
  react2AngularDirective('searchResult', SearchResult, []);
  react2AngularDirective('tagFilter', TagFilter, [
    'tags',
    ['onChange', { watchDepth: 'reference' }],
    ['tagOptions', { watchDepth: 'reference' }],
  ]);

  // ── Form controls ─────────────────────────────────────────────────────────

  react2AngularDirective('gfFormSwitch', Switch, [
    'checked',
    ['onChange', { watchDepth: 'reference' }],
    'label', 'labelClass', 'switchClass', 'transparent',
  ]);
  react2AngularDirective('deleteButton', DeleteButton, [
    ['onConfirm', { watchDepth: 'reference' }],
  ]);
  react2AngularDirective('infoTooltip', Tooltip, ['content', 'placement', 'className']);

  // ── Sprint 2 ──────────────────────────────────────────────────────────────

  // navbar: replaces NavbarCtrl + navbar.html
  react2AngularDirective('navbar', Navbar, ['model']);

  // searchPanel: self-contained, no props — drop in once as a singleton
  react2AngularDirective('searchPanel', SearchPanel, []);

  // searchResults: replaces SearchResultsCtrl + search_results.html
  react2AngularDirective('searchResults', SearchResults, [
    'results', 'editable', 'isTemplate',
    ['onTagSelected',      { watchDepth: 'reference' }],
    ['onFolderExpanding',  { watchDepth: 'reference' }],
    ['onToggleSelection',  { watchDepth: 'reference' }],
    ['onEditSelected',     { watchDepth: 'reference' }],
    ['onHideMenu',         { watchDepth: 'reference' }],
    ['onShowAllFolders',   { watchDepth: 'reference' }],
    'selectedFolderId',
  ]);

  // ── Sprint 3 ──────────────────────────────────────────────────────────────

  // valueSelectDropdown: replaces ValueSelectDropdownCtrl + valueSelectDropdown.html
  // Same directive element name so no .html changes needed.
  react2AngularDirective('valueSelectDropdown', ValueSelectDropdown, [
    ['variable',  { watchDepth: 'reference' }],
    ['onUpdated', { watchDepth: 'reference' }],
  ]);

  // gfFormDropdown: replaces FormDropdownCtrl + jQuery typeahead
  react2AngularDirective('gfFormDropdown', FormDropdown, [
    ['model',      { watchDepth: 'reference' }],
    ['getOptions', { watchDepth: 'reference' }],
    ['onChange',   { watchDepth: 'reference' }],
    'cssClass', 'allowCustom', 'labelMode',
    'lookupText', 'placeholder', 'startOpen', 'debounce',
  ]);

  // grafanaAppRoot: headless component, mount once in the main template.
  // Manages sidemenu, kiosk, inactivity detection and body-click handling.
  react2AngularDirective('grafanaAppRoot', GrafanaAppRoot, []);

  // ── ⏳ Next up ─────────────────────────────────────────────────────────────
  // Add entries here as components are converted. Pattern:
  //   import MyComp from './components/MyComp/MyComp';
  //   react2AngularDirective('myComp', MyComp, ['propA', 'propB']);
}
