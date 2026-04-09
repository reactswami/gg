/**
 * angularComponents.ts
 *
 * Pre-instantiated angular2React wrappers for Angular directives that are
 * consumed directly inside React page components during the migration.
 *
 * Remove each export once the underlying Angular directive is replaced by
 * a native React component.
 */

import { angular2React } from 'app/core/bridge/angular2react';

// ── manage-dashboards directive ────────────────────────────────────────────
interface ManageDashboardsProps {
  folderId?: number;
  folderUid?: string;
}
export const AngularManageDashboards = angular2React<ManageDashboardsProps>(
  'manage-dashboards',
  ['folderId', 'folderUid']
);

// ── manage-templates directive ─────────────────────────────────────────────
export const AngularManageTemplates = angular2React<{}>('manage-templates', []);

// ── prefs-control directive ────────────────────────────────────────────────
interface PrefsControlProps {
  resourceUri: string;
}
export const AngularPrefsControl = angular2React<PrefsControlProps>(
  'prefs-control',
  ['resourceUri']
);
