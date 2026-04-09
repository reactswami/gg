/**
 * angular_wrappers.ts
 *
 * Registers React components as AngularJS directives so they can be used
 * in existing Angular templates during the migration.
 *
 * Import path change: now uses the new bridge instead of the old util:
 *   Before: import { react2AngularDirective } from 'app/core/utils/react2angular';
 *   After:  import { react2AngularDirective } from 'app/core/bridge';
 *
 * When a component's Angular usage is fully removed from all .html templates,
 * delete its entry here.
 *
 * Migration status key:
 *   ✅ React-native (no Angular wrapper needed once templates updated)
 *   🔄 Wrapped — React component registered as Angular directive
 *   ⏳ Planned
 */

import { react2AngularDirective } from 'app/core/bridge';

// ✅ Already React, registered for Angular template consumption
import PageHeader from './components/PageHeader/PageHeader';
import EmptyListCTA from './components/EmptyListCTA/EmptyListCTA';
import { SearchResult } from './components/search/SearchResult';
import { TagFilter } from './components/TagFilter/TagFilter';

// ✅ Already React — recently migrated
import { Switch } from './components/Switch/Switch';
import { DeleteButton } from './components/DeleteButton/DeleteButton';
import { Tooltip } from './components/Tooltip/Tooltip';

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

  react2AngularDirective('infoTooltip', Tooltip, [
    'content',
    'placement',
    'className',
  ]);

  // ---------------------------------------------------------------------------
  // ⏳ Add new entries here as components are converted to React:
  //
  //   import Navbar from './components/Navbar/Navbar';
  //   react2AngularDirective('navbar', Navbar, ['model']);
  //
  // Then remove the corresponding Angular directive registration from the
  // original directive file (e.g. navbar.ts) and delete the @ngInject version.
  // ---------------------------------------------------------------------------
}
