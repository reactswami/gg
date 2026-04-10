/**
 * TemplateListPage
 *
 * React page replacing TemplateListCtrl + template_list.html.
 * Route: /templates
 *
 * ManageTemplates is still Angular — bridged via angularComponents.
 */

import React, { useState } from 'react';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import { AngularManageTemplates } from 'app/core/bridge/angularComponents';
import { useAngularService } from 'app/core/hooks/useAngularService';

const TemplateListPage: React.FC = () => {
  const navModelSrv = useAngularService('navModelSrv');
  const [navModel]  = useState(() => navModelSrv.getNav('dashboards', 'manage-templates', 0));

  return (
    <>
      <PageHeader model={navModel} />
      <div className="page-container page-body">
        <AngularManageTemplates />
      </div>
    </>
  );
};

export default TemplateListPage;
