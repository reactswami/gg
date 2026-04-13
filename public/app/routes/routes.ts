/**
 * routes.ts
 *
 * Angular route configuration - ALL routes have been migrated to React.
 * This file is kept only to:
 *   1. Bootstrap the AppRouterMount directive (React router)
 *   2. Register the catch-all .otherwise() for any unmatched paths
 *      (React's catch-all NotFoundPage handles these first via routeRegistry)
 *
 * FULLY MIGRATED TO REACT:
 *   All routes now live in: app/routes/routeRegistry.ts
 *   React router mounts via: <app-router-mount> in index.html
 *
 * TODO: Once ng-view is removed from index.html and Angular is fully
 * bootstrapped only for service initialization, this file and
 * setupAngularRoutes can be deleted entirely.
 */

import './dashboard_loaders';   // still needed: registers DashboardLoaderSrv
import './ReactContainer';       // still needed: registers <react-container>
import './AppRouterMount';       // registers <app-router-mount> directive

import { applyRouteRegistrationHandlers } from './registry';

/** @ngInject */
export function setupAngularRoutes($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  // All application routes are now handled by the React router (routeRegistry.ts).
  // Angular only needs the otherwise() as a fallback - React's NotFoundPage
  // will intercept unmatched paths before Angular's ng-view renders.
  $routeProvider.otherwise({
    templateUrl: 'public/app/partials/error.html',
    controller: 'ErrorCtrl',
  });

  applyRouteRegistrationHandlers($routeProvider);
}
