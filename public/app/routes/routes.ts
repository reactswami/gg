/**
 * routes.ts
 *
 * Angular route configuration — only routes NOT yet migrated to React remain
 * here. As each route is converted, remove its .when() block.
 *
 * React routes live in: app/routes/routeRegistry.ts
 * React router mounts via: <app-router-mount> in index.html
 *
 * MIGRATED TO REACT (removed from Angular):
 *   /dashboards                          → DashboardListPage
 *   /templates                           → TemplateListPage
 *   /dashboard/snapshots                 → SnapshotListPage
 *   /profile                             → ProfilePage
 *   /dashboards/f/:uid/:slug/permissions → FolderPermissions (already React)
 *   /dashboards/f/:uid/:slug/settings    → FolderSettingsPage (already React)
 *   /dashboards/f/:uid/:slug             → FolderDashboardsPage
 *   /dashboards/f/:uid                   → FolderDashboardsPage
 *
 * STILL ANGULAR (pending migration):
 *   /                                    → LoadDashboardCtrl (dashboard)
 *   /d/:uid/:slug                        → LoadDashboardCtrl (dashboard)
 *   /d/:uid                              → LoadDashboardCtrl (dashboard)
 *   /dashboard/:type/:slug               → LoadDashboardCtrl (dashboard)
 *   /d-solo/:uid/:slug                   → SoloPanelCtrl
 *   /dashboard-solo/:type/:slug          → SoloPanelCtrl
 *   /dashboard/new                       → NewDashboardCtrl
 *   /dashboard/import                    → DashboardImportCtrl
 *   /template/import                     → TemplateImportCtrl
 *   /dashboards/folder/new               → CreateFolderCtrl
 */

import './dashboard_loaders';
import './ReactContainer';
import './AppRouterMount';       // registers <app-router-mount> directive

import { applyRouteRegistrationHandlers } from './registry';

/** @ngInject */
export function setupAngularRoutes($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider
    // ── Dashboard viewer routes migrated to React (DashboardPage.tsx) ────────

    // ── Catch-all: Angular 404 (React catch-all in routeRegistry handles
    //    React-owned paths before Angular sees them) ─────────────────────────
    .otherwise({
      templateUrl: 'public/app/partials/error.html',
      controller: 'ErrorCtrl',
    });

  applyRouteRegistrationHandlers($routeProvider);
}
