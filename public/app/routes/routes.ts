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
    // ── Dashboard viewer (not yet migrated — complex DashboardCtrl) ────────
    .when('/', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/d/:uid/:slug', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/d/:uid', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard/:type/:slug', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })

    // ── Solo panel ─────────────────────────────────────────────────────────
    .when('/d-solo/:uid/:slug', {
      templateUrl: 'public/app/features/panel/partials/soloPanel.html',
      controller: 'SoloPanelCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard-solo/:type/:slug', {
      templateUrl: 'public/app/features/panel/partials/soloPanel.html',
      controller: 'SoloPanelCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })

    // ── New / import dashboard ─────────────────────────────────────────────
    .when('/dashboard/new', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'NewDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard/import', {
      templateUrl: 'public/app/features/dashboard/partials/dashboard_import.html',
      controller: 'DashboardImportCtrl',
      controllerAs: 'ctrl',
    })
    .when('/template/import', {
      templateUrl: 'public/app/features/dashboard/template/partials/template_import.html',
      controller: 'TemplateImportCtrl',
      controllerAs: 'ctrl',
    })

    // ── New folder ─────────────────────────────────────────────────────────
    .when('/dashboards/folder/new', {
      templateUrl: 'public/app/features/dashboard/partials/create_folder.html',
      controller: 'CreateFolderCtrl',
      controllerAs: 'ctrl',
    })

    // ── Catch-all: Angular 404 (React catch-all in routeRegistry handles
    //    React-owned paths before Angular sees them) ─────────────────────────
    .otherwise({
      templateUrl: 'public/app/partials/error.html',
      controller: 'ErrorCtrl',
    });

  applyRouteRegistrationHandlers($routeProvider);
}
