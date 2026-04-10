# Angular → React Migration Tracker

> Auto-generated snapshot — update statuses as components are migrated.
> Current state: **76 React components / 65 Angular directive files / 71 HTML templates / 17 Angular routes / 2 React routes**

---

## How to use this document

| Status | Meaning |
|--------|---------|
| 🔴 Angular | Pure AngularJS — controller + HTML template, no React yet |
| 🟡 Bridged | React component registered via `react2AngularDirective`; still consumed by Angular templates |
| 🟢 React | Fully React; Angular wrapper can be removed once all `.html` refs are gone |
| ✅ Done | Angular code deleted; no bridge needed |

When you migrate a component:
1. Change its row from 🔴 to 🟡 (bridged) or 🟢 (fully React)
2. Open a PR, reference this file in the description
3. When the last `.html` template reference is removed, flip to ✅ Done and delete the directive file

---

## Routes

| Route | Template / Controller | Status |
|-------|-----------------------|--------|
| `/` | `dashboard.html` / `LoadDashboardCtrl` | 🔴 Angular |
| `/d/:uid/:slug` | `dashboard.html` / `LoadDashboardCtrl` | 🔴 Angular |
| `/dashboard/import` | `dashboard_import.html` / `DashboardImportCtrl` | 🔴 Angular |
| `/template/import` | `template_import.html` / `TemplateImportCtrl` | 🔴 Angular |
| `/dashboards` | `DashboardListPage.tsx` | 🟢 React |
| `/templates` | `TemplateListPage.tsx` | 🟢 React |
| `/dashboards/folder/new` | `create_folder.html` / `CreateFolderCtrl` | 🔴 Angular |
| `/dashboards/f/:uid/:slug` | `FolderDashboardsPage.tsx` | 🟢 React |
| `/profile` | `ProfilePage.tsx` | 🟢 React |
| `/dashboard/snapshots` | `SnapshotListPage.tsx` | 🟢 React |
| `/d-solo/:uid/:slug` | `soloPanel.html` / `SoloPanelCtrl` | 🔴 Angular |
| **`/dashboards/f/:uid/:slug/permissions`** | `<react-container>` / `FolderPermissions` | 🟢 React |
| **`/dashboards/f/:uid/:slug/settings`** | `<react-container>` / `FolderSettingsPage` | 🟢 React |

---

## Core UI Directives (`public/app/core/`)

| Directive | File | React Component | Status |
|-----------|------|-----------------|--------|
| `page-header` | `components/PageHeader/PageHeader.tsx` | `PageHeader` | 🟡 Bridged |
| `empty-list-cta` | `components/EmptyListCTA/EmptyListCTA.tsx` | `EmptyListCTA` | 🟡 Bridged |
| `search-result` | `components/search/SearchResult.tsx` | `SearchResult` | 🟡 Bridged |
| `tag-filter` | `components/TagFilter/TagFilter.tsx` | `TagFilter` | 🟡 Bridged |
| `gf-form-switch` | `components/Switch/Switch.tsx` | `Switch` | 🟡 Bridged |
| `delete-button` | `components/DeleteButton/DeleteButton.tsx` | `DeleteButton` | 🟡 Bridged |
| `info-tooltip` | `components/Tooltip/Tooltip.tsx` | `Tooltip` | 🟡 Bridged |
| `navbar` | `components/Navbar/Navbar.tsx` | `Navbar` | 🟡 Bridged |
| `dashnav` | `features/dashboard/components/DashNav/DashNav.tsx` | `DashNav` | 🟡 Bridged |
| `dashboard-search` | `components/Search/SearchPanel.tsx` | `SearchPanel` | 🟡 Bridged |
| `dashboard-search-results` | `components/Search/SearchResults.tsx` | `SearchResults` | 🟡 Bridged |
| `gf-form-dropdown` | `components/FormDropdown/FormDropdown.tsx` | `FormDropdown` | 🟡 Bridged |
| `dashboard-submenu` | `features/dashboard/components/DashboardSubmenu/DashboardSubmenu.tsx` | `DashboardSubmenu` | 🟡 Bridged |
| `grafana-scrollbar` | `components/CustomScrollbar/CustomScrollbar.tsx` | `CustomScrollbar` (existing) | 🟢 React |
| `page-scrollbar` | `components/Scrollbar/PageScrollbar.tsx` | `PageScrollbar` | 🟡 Bridged |
| `gf-page` | `components/GfPage/GfPage.tsx` | `GfPage` | 🟡 Bridged |
| `info-popover` | `components/InfoPopover/InfoPopover.tsx` | `InfoPopover` | 🟡 Bridged |
| `gf-dashboard-link` | `components/link.ts` | — | 🔴 Angular |
| `manage-dashboards` | `components/manage_dashboards/manage_dashboards.ts` | — | 🔴 Angular |
| `manage-templates` | `components/manage_templates/manage_templates.ts` | — | 🔴 Angular |
| `query-part-editor` | `components/query_part/query_part.ts` | — | 🔴 Angular |
| `sql-part-editor` | `components/sql_part/sql_part_editor.ts` | — | 🔴 Angular |
| `spectrum-picker` | `components/colorpicker/spectrum_picker.ts` | `SpectrumPicker.tsx` exists | 🟡 Bridged |
| `code-editor` | `components/code_editor/code_editor.ts` | — | 🔴 Angular |
| `json-tree` | `components/jsontree/jsontree.ts` | — | 🔴 Angular |

---

## Core Directives (`public/app/core/directives/`)

| Directive | File | Status |
|-----------|------|--------|
| `value-select-dropdown` | `directives/value_select_dropdown.ts` | 🔴 Angular |
| `metric-segment` | `directives/metric_segment.ts` | 🔴 Angular |
| `metric-segment-model` | `directives/metric_segment.ts` | 🔴 Angular |
| `dropdown-typeahead` | `directives/dropdown_typeahead.ts` | 🔴 Angular |
| `ng-model-onblur` | `core/hooks/utilityHooks.ts` → `useOnBlurModel` | ✅ Done |
| `valid-time-span` | `directives/ng_model_on_blur.ts` | 🔴 Angular |
| `empty-to-null` | `directives/ng_model_on_blur.ts` | 🔴 Angular |
| `bootstrap-tagsinput` | `directives/tags.ts` | 🔴 Angular |
| `tag-color-from-name` | `directives/tags.ts` | 🔴 Angular |
| `give-focus` | `core/hooks/utilityHooks.ts` → `useGiveFocus` | ✅ Done |
| `rebuild-on-change` | `core/hooks/utilityHooks.ts` → `useRebuildOnChange` | ✅ Done |
| `dash-class` | `core/hooks/utilityHooks.ts` → `useDashClass` | ✅ Done |
| `diff-delta` | `directives/diff-view.ts` | 🔴 Angular |
| `diff-link-json` | `directives/diff-view.ts` | 🔴 Angular |
| `array-join` | `directives/array_join.ts` | 🔴 Angular |
| `watch-change` | Native React `onChange` — no hook needed | ✅ Done |
| `compile` | `directives/misc.ts` | 🔴 Angular |
| `tip` | `directives/misc.ts` | 🔴 Angular |

---

## Dashboard Feature (`public/app/features/dashboard/`)

| Directive / Component | File | React Component | Status |
|-----------------------|------|-----------------|--------|
| `dashboard-grid` | `dashgrid/DashboardGridDirective.ts` | `DashboardGrid.tsx` | 🟡 Bridged |
| `dashboard-panel` | `dashgrid/DashboardPanel.tsx` | `DashboardPanel` | 🟢 React |
| `dashboard-row` | `dashgrid/DashboardRow.tsx` | `DashboardRow` | 🟢 React |
| `add-panel-panel` | `dashgrid/AddPanelPanel.tsx` | `AddPanelPanel` | 🟢 React |
| `panel-header` | `dashgrid/PanelHeader/PanelHeader.tsx` | `PanelHeader` | 🟢 React |
| `dashboard-settings` | `settings/` | — | 🔴 Angular |
| `ad-hoc-filters` | `ad_hoc_filters.ts` | — | 🔴 Angular |
| `row-options` | `dashgrid/` | — | 🔴 Angular |
| `dashboard-permissions` | `permissions/DashboardPermissions.tsx` | `DashboardPermissions` | 🟢 React |
| `folder-picker` | `features/dashboard/components/FolderPicker/FolderPicker.tsx` | `FolderPicker` | 🟡 Bridged |
| `dash-repeat-option` | `features/dashboard/components/DashRepeatOption/DashRepeatOption.tsx` | `DashRepeatOption` | 🟡 Bridged |
| `save-dashboard-modal` | `export/` | — | 🔴 Angular |
| `dash-export-modal` | `export/export_modal.ts` | — | 🔴 Angular |

---

## Panel Feature (`public/app/features/panel/`)

| Directive | File | Status |
|-----------|------|--------|
| `metrics-tab` | `metrics_tab.ts` | 🔴 Angular |
| `viz-tab` | `viz_tab.ts` | 🔴 Angular (wraps `VizTypePicker.tsx`) |
| `query-editor-row` | `query_editor_row.ts` | 🔴 Angular |
| `query-troubleshooter` | `query_troubleshooter.ts` | 🔴 Angular |

---

## Controllers to Migrate

| Controller | File | Status |
|------------|------|--------|
| `GrafanaCtrl` | `routes/GrafanaCtrl.ts` | 🔴 Angular |
| `LoadDashboardCtrl` | `routes/dashboard_loaders.ts` | 🔴 Angular |
| `DashboardCtrl` | `features/dashboard/dashboard_ctrl.ts` | 🔴 Angular |
| `ProfileCtrl` | `features/profile/ProfileCtrl.ts` | ✅ Done — ProfilePage.tsx |
| `PrefControlCtrl` | `features/profile/PrefControlCtrl.ts` | 🔴 Angular |
| `ValueSelectDropdownCtrl` | `core/directives/value_select_dropdown.ts` | ✅ Done — ValueSelectDropdown.tsx |
| `SearchCtrl` | `core/components/search/search.ts` | ✅ Done — SearchPanel.tsx |
| `NavbarCtrl` | `core/components/navbar/navbar.ts` | ✅ Done — Navbar.tsx |
| `DashboardImportCtrl` | `features/dashboard/` | 🔴 Angular |
| `FolderDashboardsCtrl` | `features/folders/` | 🔴 Angular |

---

## Services to Migrate

| Service | File | Migration Path |
|---------|------|---------------|
| `backendSrv` | `core/services/backend_srv.ts` | RTK Query / axios module |
| `datasourceSrv` | `features/plugins/datasource_srv.ts` | React datasource registry |
| `contextSrv` | `core/services/context_srv.ts` | Redux slice |
| `searchSrv` | `core/services/search_srv.ts` | RTK Query |
| `KeybindingSrv` | `core/services/keybindingSrv.ts` | `useEffect` + event listeners |

---

## Bridge Infrastructure

| File | Purpose | Status |
|------|---------|--------|
| `core/bridge/react2angular.tsx` | Wraps React → usable in Angular templates | ✅ Done |
| `core/bridge/angular2react.tsx` | Wraps Angular directives → usable in React JSX | ✅ Done |
| `core/bridge/index.ts` | Central exports + pre-wrapped Angular components | ✅ Done |
| `core/hooks/useAngularService.ts` | `$injector.get()` as a React hook | ✅ Done |
| `core/hooks/useAppEvents.ts` | Angular `appEvents` subscribe/emit as hooks | ✅ Done |
| `routes/ReactContainer.tsx` | Full-page React route renderer (React 18 createRoot) | ✅ Done |
| `core/utils/react2angular.ts` | Deprecated shim → re-exports from bridge | ✅ Done |
| `core/services/ng_react.ts` | Legacy ng-react service (keep until app.ts cleaned up) | 🔴 Remove last |

## Routing Infrastructure

| File | Purpose | Status |
|------|---------|--------|
| `routes/routeRegistry.ts` | React route table (lazy page imports) | ✅ Done |
| `routes/AppRouter.tsx` | BrowserRouter + Switch, coexists with Angular ngRoute | ✅ Done |
| `routes/AppRouterMount.tsx` | Angular directive that mounts AppRouter into the DOM | ✅ Done |
| `routes/routes.ts` | Angular ngRoute config — 8 routes removed, 9 remain | 🔄 Shrinking |
| `core/bridge/angularComponents.ts` | Pre-wrapped Angular directives for React pages | ✅ Done |

### React routes active (11 total)
| Path | Page Component |
|------|---------------|
| `/dashboards` | `DashboardListPage` |
| `/templates` | `TemplateListPage` |
| `/dashboard/snapshots` | `SnapshotListPage` |
| `/profile` | `ProfilePage` |
| `/dashboards/f/:uid/:slug/permissions` | `FolderPermissions` |
| `/dashboards/f/:uid/:slug/settings` | `FolderSettingsPage` |
| `/dashboards/f/:uid/:slug` | `FolderDashboardsPage` |
| `/dashboards/f/:uid` | `FolderDashboardsPage` |
| `*` | `NotFoundPage` |

### Angular routes remaining (9 total)
| Path | Controller |
|------|-----------|
| `/` | `LoadDashboardCtrl` |
| `/d/:uid/:slug` | `LoadDashboardCtrl` |
| `/d/:uid` | `LoadDashboardCtrl` |
| `/dashboard/:type/:slug` | `LoadDashboardCtrl` |
| `/d-solo/:uid/:slug` | `SoloPanelCtrl` |
| `/dashboard-solo/:type/:slug` | `SoloPanelCtrl` |
| `/dashboard/new` | `NewDashboardCtrl` |
| `/dashboard/import` | `DashboardImportCtrl` |
| `/template/import` | `TemplateImportCtrl` |
| `/dashboards/folder/new` | `CreateFolderCtrl` |
