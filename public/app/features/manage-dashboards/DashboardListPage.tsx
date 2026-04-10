/**
 * DashboardListPage
 *
 * React page replacing DashboardListCtrl + dashboard_list.html.
 * Route: /dashboards
 */

import React, { useState } from 'react';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import ManageDashboards from 'app/core/components/ManageDashboards/ManageDashboards';
import { useAngularService } from 'app/core/hooks/useAngularService';

interface Props {
  routeParams?: Record<string, string>;
}

const DashboardListPage: React.FC<Props> = () => {
  const navModelSrv = useAngularService('navModelSrv');
  const [navModel]  = useState(() => navModelSrv.getNav('dashboards', 'manage-dashboards', 0));

  return (
    <>
      <PageHeader model={navModel} />
      <div className="page-container page-body">
        <ManageDashboards />
      </div>
    </>
  );
};

export default DashboardListPage;
