/**
 * React Route Registry
 *
 * Declares all application routes as typed objects consumed by
 * AppRouter (routes/AppRouter.tsx).
 *
 * Migration guide
 * ───────────────
 * 1. Add a new entry to REACT_ROUTES below.
 * 2. Remove the corresponding `.when(...)` block from setupAngularRoutes()
 *    in routes.ts once the React page is verified working.
 * 3. When ALL routes are migrated, delete routes.ts and remove
 *    setupAngularRoutes from app.ts.
 *
 * Route definition shape
 * ──────────────────────
 *   path        react-router path string (supports :param notation)
 *   component   lazy-imported React page component
 *   pageClass   optional body CSS class applied while this route is active
 *   roles       optional role strings required to access this route
 *   exact       default true; set false to match sub-paths
 */

import { lazy } from 'react';

export interface ReactRoute {
  path: string;
  component: React.LazyExoticComponent<any>;
  pageClass?: string;
  roles?: string[];
  exact?: boolean;
}

// ---------------------------------------------------------------------------
// Page components — all lazy-loaded so unchanged Angular routes pay no cost
// ---------------------------------------------------------------------------

const DashboardListPage   = lazy(() => import('app/features/manage-dashboards/DashboardListPage'));
const TemplateListPage    = lazy(() => import('app/features/manage-dashboards/TemplateListPage'));
const SnapshotListPage    = lazy(() => import('app/features/manage-dashboards/SnapshotListPage'));
const ProfilePage         = lazy(() => import('app/features/profile/ProfilePage'));
const FolderDashboardsPage = lazy(() => import('app/features/dashboard/pages/FolderDashboardsPage'));
const FolderPermissionsPage = lazy(() => import('app/features/folders/FolderPermissions'));
const FolderSettingsPage  = lazy(() => import('app/features/folders/FolderSettingsPage'));
const NotFoundPage        = lazy(() => import('app/features/misc/NotFoundPage'));
const DashboardPage        = lazy(() => import('app/features/dashboard/pages/DashboardPage'));

const CreateFolderPage     = lazy(() => import('app/features/dashboard/pages/CreateFolderPage'));
const DashboardImportPage  = lazy(() => import('app/features/dashboard/pages/DashboardImportPage'));


// ---------------------------------------------------------------------------
// Route table
// Ordered from most-specific to least-specific (react-router-dom v5 uses
// <Switch> which stops at the first match when exact=true).
// ---------------------------------------------------------------------------

export const REACT_ROUTES: ReactRoute[] = [
  // ── Folder routes ─────────────────────────────────────────────────────────
  {
    path: '/dashboards/f/:uid/:slug/permissions',
    component: FolderPermissionsPage,
  },
  {
    path: '/dashboards/f/:uid/:slug/settings',
    component: FolderSettingsPage,
  },
  {
    path: '/dashboards/f/:uid/:slug',
    component: FolderDashboardsPage,
  },
  {
    path: '/dashboards/f/:uid',
    component: FolderDashboardsPage,
  },

  // ── Manage pages ──────────────────────────────────────────────────────────
  {
    path: '/dashboards',
    component: DashboardListPage,
    exact: true,
  },
  {
    path: '/templates',
    component: TemplateListPage,
    exact: true,
  },
  {
    path: '/dashboard/snapshots',
    component: SnapshotListPage,
    exact: true,
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  {
    path: '/profile',
    component: ProfilePage,
    exact: true,
  },

  // ── New folder ───────────────────────────────────────────────────────────
  {
    path: '/dashboards/folder/new',
    component: CreateFolderPage,
    exact: true,
  },

  // ── Dashboard import ──────────────────────────────────────────────────────
  {
    path: '/dashboard/import',
    component: DashboardImportPage,
    exact: true,
  },
  {
    path: '/template/import',
    component: DashboardImportPage,
    exact: true,
  },

  // ── Dashboard viewer ─────────────────────────────────────────────────────
  // These replace LoadDashboardCtrl + DashboardCtrl + dashboard.html
  {
    path: '/d/:uid/:slug',
    component: DashboardPage,
    pageClass: 'page-dashboard',
    exact: true,
  },
  {
    path: '/d/:uid',
    component: DashboardPage,
    pageClass: 'page-dashboard',
    exact: true,
  },
  {
    path: '/dashboard/:type/:slug',
    component: DashboardPage,
    pageClass: 'page-dashboard',
    exact: true,
  },
  {
    path: '/dashboard/new',
    component: DashboardPage,
    pageClass: 'page-dashboard',
    exact: true,
  },
  // Home dashboard (root path handled last so specific paths match first)
  {
    path: '/',
    component: DashboardPage,
    pageClass: 'page-dashboard',
    exact: true,
  },

  // ── 404 catch-all (must be last) ──────────────────────────────────────────
  {
    path: '*',
    component: NotFoundPage,
    exact: false,
  },
];
