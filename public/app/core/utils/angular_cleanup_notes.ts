/**
 * Angular Cleanup Notes
 *
 * This file documents the Angular directives/controllers that have been
 * superseded by React components. Their original .ts files still exist
 * (they register directive names that HTML templates reference) but the
 * implementations now come from React via angular_wrappers.ts.
 *
 * PHASE 1 — Remove duplicate directive registrations
 * Each of these files still calls coreModule.directive('X', ...) but the
 * react2AngularDirective call in angular_wrappers.ts registers the React
 * version with the same name. Angular uses the last-registered directive —
 * so as long as angular_wrappers.ts is imported AFTER these files, the
 * React version wins. Verified: angular_wrappers.ts is called in
 * GrafanaApp.init() after app/features/all imports.
 *
 * Files with superseded directive registrations:
 *   core/components/navbar/navbar.ts           → React Navbar
 *   core/components/search/search.ts           → React SearchPanel
 *   core/components/search/search_results.ts   → React SearchResults
 *   core/components/manage_dashboards/...      → React ManageDashboards
 *   core/components/manage_templates/...       → React ManageTemplates
 *   core/components/form_dropdown/...          → React FormDropdown
 *   core/components/code_editor/...            → React CodeEditor
 *   core/components/jsontree/jsontree.ts       → React JsonTree
 *   core/components/info_popover.ts            → React InfoPopover
 *   core/components/gf_page.ts                 → React GfPage
 *   core/components/scroll/page_scroll.ts      → React PageScrollbar
 *   features/dashboard/dashnav/dashnav.ts      → React DashNav
 *   features/dashboard/submenu/submenu.ts      → React DashboardSubmenu
 *   features/dashboard/settings/settings.ts    → React DashboardSettings
 *   features/dashboard/ad_hoc_filters.ts       → React AdHocFilters
 *   features/dashboard/folder_picker/...       → React FolderPicker
 *   features/dashboard/export/export_modal.ts  → React ExportModal
 *   features/dashboard/save_modal.ts           → React SaveDashboardModal
 *   features/dashboard/history/history.ts      → React DashboardHistory
 *   features/dashboard/dashlinks/...           → React DashLinksEditor
 *   features/panel/metrics_tab.ts              → React MetricsTab
 *   features/panel/viz_tab.ts                  → React VizTab
 *   features/panel/query_editor_row.ts         → React QueryEditorRow
 *   features/panel/query_troubleshooter.ts     → React QueryTroubleshooter
 *   core/directives/metric_segment.ts          → React MetricSegment
 *   features/dashboard/repeat_option/...       → React DashRepeatOption
 *   features/dashboard/dashgrid/RowOptions.ts  → React RowOptions
 *   core/components/switch.ts                  → React Switch (gfFormSwitch)
 *   core/directives/value_select_dropdown.ts   → React ValueSelectDropdown
 *
 * PHASE 2 — Delete these files (after verifying no HTML template
 * references the Angular version's templateUrl paths):
 *   The .html template files in partials/ can also be removed once
 *   all consumers have been updated to the React components.
 *
 * PHASE 3 — Remove Angular from app.ts (final step):
 *   - Remove ngModuleDependencies bootstrap
 *   - Remove angular-route, angular-sanitize, dndLists, ang-drag-drop imports
 *   - Move service singletons (setBackendSrv, configureStore etc.) to
 *     a pure TypeScript init module
 *   - Delete ng_react.ts after app.ts no longer references 'react' module
 */
export {};

// ── Plugin migration additions ─────────────────────────────────────────────

/**
 * Panel plugin Angular base classes — now dead code:
 *
 * features/panel/panel_ctrl.ts          — @deprecated, safe to delete
 * features/panel/metrics_panel_ctrl.ts  — @deprecated, safe to delete
 * plugins/sdk.ts                        — @deprecated, safe to delete
 *
 * All 8 active panel plugins now export PanelComponent (React).
 * DashboardPanel.tsx uses the React path when PanelComponent is present.
 * The Angular plugin-component directive path in DashboardPanel is dead.
 *
 * Panel Angular infrastructure to remove in Phase 3:
 *   - features/panel/panel_directive.ts   (Angular panel shell + resizable)
 *   - features/panel/panel_editor_tab.ts  (Angular dynamic tab directive)
 *   - features/panel/solo_panel_ctrl.ts   (SoloPanelCtrl)
 *   - features/panel/all.ts               (imports all of the above)
 *   - features/plugins/plugin_component.ts (pluginDirectiveLoader)
 *
 * Replace with: PanelChrome + DataPanel (already React) handle everything.
 *
 * Unknown panel plugin:
 *   plugins/panel/unknown/module.ts — trivial Angular shell, keep until
 *   DashboardPanel has a built-in React "unknown panel type" fallback.
 */
