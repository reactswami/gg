/**
 * angular_wrappers.ts
 *
 * Central registry: registers React components as AngularJS directives so
 * existing Angular templates can consume them during the migration.
 *
 * Remove an entry once all .html template references to that directive are gone.
 */

import { react2AngularDirective } from 'app/core/bridge';

// -- Pre-existing React components ------------------------------------------
import PageHeader from './components/PageHeader/PageHeader';
import EmptyListCTA from './components/EmptyListCTA/EmptyListCTA';
import { SearchResult } from './components/search/SearchResult';
import { TagFilter } from './components/TagFilter/TagFilter';
import { Switch } from './components/Switch/Switch';
import { DeleteButton } from './components/DeleteButton/DeleteButton';
import { Tooltip } from './components/Tooltip/Tooltip';

// -- Sprint 2: Navbar + Search ----------------------------------------------
import Navbar from './components/Navbar/Navbar';
import SearchPanel from './components/Search/SearchPanel';
import SearchResults from './components/Search/SearchResults';

// -- Sprint 3: ValueSelectDropdown + FormDropdown + GrafanaAppRoot ----------
import ValueSelectDropdown from './components/ValueSelectDropdown/ValueSelectDropdown';
import FormDropdown from './components/FormDropdown/FormDropdown';
import GrafanaAppRoot from './components/GrafanaApp/GrafanaAppRoot';


// -- Sprint 4: Dashboard directives -----------------------------------------
import DashNav from 'app/features/dashboard/components/DashNav/DashNav';
import FolderPicker from 'app/features/dashboard/components/FolderPicker/FolderPicker';
import DashboardSubmenu from 'app/features/dashboard/components/DashboardSubmenu/DashboardSubmenu';


// -- Sprint 5: Utility components + hooks -----------------------------------
import InfoPopover from './components/InfoPopover/InfoPopover';
import GfPage from './components/GfPage/GfPage';
import PageScrollbar from './components/Scrollbar/PageScrollbar';
import DashRepeatOption from 'app/features/dashboard/components/DashRepeatOption/DashRepeatOption';


// -- Sprint 6: DashboardSettings --------------------------------------------
import DashboardSettings from 'app/features/dashboard/components/DashboardSettings/DashboardSettings';


// -- Sprint 7: ManageDashboards, TagsInput, RowOptions ----------------------
import ManageDashboards from './components/ManageDashboards/ManageDashboards';
import TagsInput from './components/TagsInput/TagsInput';
import RowOptions from 'app/features/dashboard/components/RowOptions/RowOptions';


// -- Sprint 8: Modal + link components --------------------------------------
import DashLinksEditor from 'app/features/dashboard/components/DashLinksEditor/DashLinksEditor';
import SaveDashboardModal from 'app/features/dashboard/components/SaveDashboardModal/SaveDashboardModal';
import ExportModal from 'app/features/dashboard/components/ExportModal/ExportModal';


// -- Sprint 9: ManageTemplates + QueryTroubleshooter ------------------------
import ManageTemplates from './components/ManageTemplates/ManageTemplates';
import QueryTroubleshooter from 'app/features/panel/components/QueryTroubleshooter';


// -- Sprint 10: CodeEditor, JsonTree, QueryEditorRow ------------------------
import CodeEditor from './components/CodeEditor/CodeEditor';
import JsonTree from './components/JsonTree/JsonTree';
import QueryEditorRow from 'app/features/panel/components/QueryEditorRow';


// -- Sprint 11: MetricSegment, AdHocFilters, MetricsTab, VizTab ------------
import MetricSegment from './components/MetricSegment/MetricSegment';
import AdHocFilters from 'app/features/dashboard/components/AdHocFilters/AdHocFilters';
import MetricsTab from 'app/features/panel/components/MetricsTab';
import VizTab from 'app/features/panel/components/VizTab';

// -- Routing ----------------------------------------------------------------
// AppRouterMount self-registers its directive on import -- no react2AngularDirective needed
import 'app/routes/AppRouterMount';

export function registerAngularDirectives() {
  // -- Core UI ---------------------------------------------------------------

  react2AngularDirective('pageHeader', PageHeader, ['model', 'noTabs']);
  react2AngularDirective('emptyListCta', EmptyListCTA, ['model']);
  react2AngularDirective('searchResult', SearchResult, []);
  react2AngularDirective('tagFilter', TagFilter, [
    'tags',
    ['onChange', { watchDepth: 'reference' }],
    ['tagOptions', { watchDepth: 'reference' }],
  ]);

  // -- Form controls ---------------------------------------------------------

  react2AngularDirective('gfFormSwitch', Switch, [
    'checked',
    ['onChange', { watchDepth: 'reference' }],
    'label', 'labelClass', 'switchClass', 'transparent',
  ]);
  react2AngularDirective('deleteButton', DeleteButton, [
    ['onConfirm', { watchDepth: 'reference' }],
  ]);
  react2AngularDirective('infoTooltip', Tooltip, ['content', 'placement', 'className']);

  // -- Sprint 2 --------------------------------------------------------------

  // navbar: replaces NavbarCtrl + navbar.html
  react2AngularDirective('navbar', Navbar, ['model']);

  // searchPanel: self-contained, no props -- drop in once as a singleton
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

  // -- Sprint 3 --------------------------------------------------------------

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


  // -- Sprint 4: Dashboard directives -----------------------------------------

  // dashnav: replaces DashNavCtrl + dashnav.html
  react2AngularDirective('dashnav', DashNav, [
    ['dashboard', { watchDepth: 'reference' }],
  ]);

  // folderPicker: replaces FolderPickerCtrl + folder_picker.html
  react2AngularDirective('folderPicker', FolderPicker, [
    'initialTitle', 'initialFolderId', 'labelClass',
    'enableCreateNew', 'enableReset',
    ['onChange',              { watchDepth: 'reference' }],
    ['onLoad',                { watchDepth: 'reference' }],
    ['enterFolderCreation',   { watchDepth: 'reference' }],
    ['exitFolderCreation',    { watchDepth: 'reference' }],
  ]);

  // dashboardSubmenu: replaces SubmenuCtrl + submenu.html
  react2AngularDirective('dashboardSubmenu', DashboardSubmenu, [
    ['dashboard', { watchDepth: 'reference' }],
  ]);


  // -- Sprint 5: Utility components -------------------------------------------

  // infoPopover: replaces Angular tether-drop directive
  react2AngularDirective('infoPopover', InfoPopover, [
    'mode', 'placement', 'wide',
  ]);

  // gfPage: replaces gfPageDirective layout shell
  react2AngularDirective('gfPage', GfPage, [
    ['model', { watchDepth: 'reference' }],
  ]);

  // pageScrollbar: replaces page-scrollbar attribute directive
  react2AngularDirective('pageScrollbar', PageScrollbar, ['className']);

  // dashRepeatOption: replaces dashRepeatOptionDirective
  react2AngularDirective('dashRepeatOption', DashRepeatOption, [
    ['panel',    { watchDepth: 'reference' }],
    ['onChange', { watchDepth: 'reference' }],
  ]);


  // -- Sprint 6 --------------------------------------------------------------

  // dashboardSettings: replaces SettingsCtrl + settings.html
  react2AngularDirective('dashboardSettings', DashboardSettings, [
    ['dashboard', { watchDepth: 'reference' }],
  ]);


  // -- Sprint 7 --------------------------------------------------------------

  // manageDashboards: replaces ManageDashboardsCtrl + manage_dashboards.html
  react2AngularDirective('manageDashboards', ManageDashboards, [
    ['folderId',  { watchDepth: 'reference' }],
    ['folderUid', { watchDepth: 'reference' }],
  ]);

  // tagsInput: replaces bootstrap-tagsinput Angular directive
  react2AngularDirective('tagsInput', TagsInput, [
    ['value',    { watchDepth: 'reference' }],
    ['onChange', { watchDepth: 'reference' }],
    'placeholder',
    'tagClass',
  ]);

  // rowOptions: replaces RowOptionsCtrl + row_options.html
  react2AngularDirective('rowOptions', RowOptions, [
    ['row',       { watchDepth: 'reference' }],
    ['onUpdated', { watchDepth: 'reference' }],
    ['dismiss',   { watchDepth: 'reference' }],
  ]);


  // -- Sprint 8 --------------------------------------------------------------

  // dashLinksEditor: replaces DashLinkEditorCtrl + editor.html (Links tab)
  react2AngularDirective('dashLinksEditor', DashLinksEditor, [
    ['dashboard', { watchDepth: 'reference' }],
  ]);

  // saveDashboardModal: replaces SaveDashboardModalCtrl inline template
  react2AngularDirective('saveDashboardModal', SaveDashboardModal, [
    ['dismiss', { watchDepth: 'reference' }],
  ]);

  // dashExportModal: replaces DashExportCtrl + export_modal.html
  react2AngularDirective('dashExportModal', ExportModal, [
    ['dismiss', { watchDepth: 'reference' }],
  ]);


  // -- Sprint 9 --------------------------------------------------------------

  // manageTemplates: replaces ManageTemplatesCtrl + manage_templates.html
  react2AngularDirective('manageTemplates', ManageTemplates, []);

  // queryTroubleshooter: replaces QueryTroubleshooterCtrl + template
  react2AngularDirective('queryTroubleshooter', QueryTroubleshooter, [
    ['panelCtrl', { watchDepth: 'reference' }],
    'isOpen',
  ]);


  // -- Sprint 10 -------------------------------------------------------------

  // codeEditor: replaces Ace-based Angular directive
  react2AngularDirective('codeEditor', CodeEditor, [
    'content',
    ['onChange',    { watchDepth: 'reference' }],
    ['getCompleter',{ watchDepth: 'reference' }],
    'mode', 'maxLines', 'showGutter', 'tabSize',
    'behavioursEnabled', 'snippetsEnabled',
  ]);

  // jsonTree: replaces json-tree directive using JsonExplorer
  react2AngularDirective('jsonTree', JsonTree, [
    ['object', { watchDepth: 'reference' }],
    'startExpanded', 'rootName', 'depth',
  ]);

  // queryEditorRow: replaces QueryRowCtrl + query_editor_row.html
  react2AngularDirective('queryEditorRow', QueryEditorRow, [
    ['queryCtrl', { watchDepth: 'reference' }],
    'canCollapse',
  ]);


  // -- Sprint 11 -------------------------------------------------------------

  // metricSegment: replaces jQuery typeahead-based Angular directive
  react2AngularDirective('metricSegment', MetricSegment, [
    ['segment',    { watchDepth: 'reference' }],
    ['getOptions', { watchDepth: 'reference' }],
    ['onChange',   { watchDepth: 'reference' }],
    'debounce', 'selectMode',
  ]);

  // metricSegmentModel: shares the MetricSegment React component
  react2AngularDirective('metricSegmentModel', MetricSegment, [
    ['segment',    { watchDepth: 'reference' }],
    ['getOptions', { watchDepth: 'reference' }],
    ['onChange',   { watchDepth: 'reference' }],
  ]);

  // adHocFilters: replaces AdHocFiltersCtrl + template
  react2AngularDirective('adHocFilters', AdHocFilters, [
    ['variable', { watchDepth: 'reference' }],
  ]);

  // metricsTab: replaces MetricsTabCtrl + metrics_tab.html
  react2AngularDirective('metricsTab', MetricsTab, [
    ['panelCtrl', { watchDepth: 'reference' }],
  ]);

  // vizTab: replaces VizTabCtrl + template (VizTypePicker already React)
  react2AngularDirective('vizTab', VizTab, [
    ['panelCtrl', { watchDepth: 'reference' }],
  ]);

  // -- - Next up -------------------------------------------------------------
  // Add entries here as components are converted. Pattern:
  //   import MyComp from './components/MyComp/MyComp';
  //   react2AngularDirective('myComp', MyComp, ['propA', 'propB']);
}
