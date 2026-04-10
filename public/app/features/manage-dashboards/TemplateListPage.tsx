/**
 * TemplateListPage
 *
 * React page replacing TemplateListCtrl + template_list.html.
 * Route: /templates
 */

import React, { useState } from 'react';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import ManageTemplates from 'app/core/components/ManageTemplates/ManageTemplates';
import { useAngularService } from 'app/core/hooks/useAngularService';

const TemplateListPage: React.FC = () => {
  const navModelSrv = useAngularService('navModelSrv');
  const [navModel]  = useState(() => navModelSrv.getNav('dashboards', 'manage-templates', 0));

  return (
    <>
      <PageHeader model={navModel} />
      <div className="page-container page-body">
        <ManageTemplates />
      </div>
    </>
  );
};

export default TemplateListPage;
