/**
 * FolderDashboardsPage
 *
 * React page replacing FolderDashboardsCtrl + folder_dashboards.html.
 * Routes: /dashboards/f/:uid/:slug  and  /dashboards/f/:uid
 */

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import { useAngularService } from 'app/core/hooks/useAngularService';
import locationUtil from 'app/core/utils/location_util';

// ── ManageDashboards angular2react wrapper ─────────────────────────────────
// Import the bridge-wrapped version so ManageDashboards can still render
// while its own migration is in progress.
import { AngularManageDashboards } from 'app/core/bridge/angularComponents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  uid: string;
  slug?: string;
}

interface Props {
  routeParams: RouteParams;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FolderDashboardsPage: React.FC<Props> = ({ routeParams }) => {
  const history     = useHistory();
  const backendSrv  = useAngularService<any>('backendSrv');

  const [navModel, setNavModel] = useState<any>(null);
  const [folderId, setFolderId] = useState<number | null>(null);

  useEffect(() => {
    if (!routeParams.uid) return;

    backendSrv.getFolderByUid(routeParams.uid).then((folder: any) => {
      // Redirect to canonical URL if slug has changed
      const canonicalUrl = locationUtil.stripBaseFromUrl(folder.url);
      if (canonicalUrl !== history.location.pathname) {
        history.replace(canonicalUrl);
        return;
      }

      setFolderId(folder.id);

      // Build navModel inline (ported from FolderPageLoader)
      const children: any[] = [
        {
          active: true,
          icon: 'fa fa-fw fa-th-large',
          id: 'manage-folder-dashboards',
          text: 'Dashboards',
          url: folder.url,
        },
      ];

      if (folder.canAdmin) {
        children.push(
          {
            active: false,
            icon: 'fa fa-fw fa-lock',
            id: 'manage-folder-permissions',
            text: 'Permissions',
            url: folder.url + '/permissions',
          },
          {
            active: false,
            icon: 'fa fa-fw fa-cog',
            id: 'manage-folder-settings',
            text: 'Settings',
            url: folder.url + '/settings',
          }
        );
      }

      setNavModel({
        main: {
          icon: 'fa fa-folder-open',
          id: 'manage-folder',
          subTitle: 'Manage folder dashboards & permissions',
          url: folder.url,
          text: folder.title,
          breadcrumbs: [{ title: 'Dashboards', url: 'dashboards' }],
          children,
        },
      });
    });
  }, [routeParams.uid, backendSrv, history]);

  return (
    <>
      {navModel && <PageHeader model={navModel} />}
      <div className="page-container page-body">
        {folderId && routeParams.uid && (
          <AngularManageDashboards
            folderId={folderId}
            folderUid={routeParams.uid}
          />
        )}
      </div>
    </>
  );
};

export default FolderDashboardsPage;
