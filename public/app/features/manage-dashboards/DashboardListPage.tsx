/**
 * DashboardListPage
 *
 * React page replacing DashboardListCtrl + dashboard_list.html.
 * Route: /dashboards
 */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import { ManageDashboards } from 'app/core/components/manage_dashboards/manage_dashboards_react';
import { NavModel, StoreState } from 'app/types';
import { useAngularService } from 'app/core/hooks/useAngularService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  routeParams?: Record<string, string>;
}

interface State {
  navModel: NavModel | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

class DashboardListPage extends PureComponent<Props & { navModelSrv: any }, State> {
  state: State = { navModel: null };

  componentDidMount() {
    const navModel = this.props.navModelSrv.getNav('dashboards', 'manage-dashboards', 0);
    this.setState({ navModel });
  }

  render() {
    const { navModel } = this.state;

    return (
      <>
        {navModel && <PageHeader model={navModel} />}
        <div className="page-container page-body">
          <ManageDashboards />
        </div>
      </>
    );
  }
}

// ---------------------------------------------------------------------------
// Hook wrapper — gives the class component access to Angular navModelSrv
// ---------------------------------------------------------------------------

const DashboardListPageWrapper: React.FC<Props> = (props) => {
  const navModelSrv = useAngularService('navModelSrv');
  return <DashboardListPage {...props} navModelSrv={navModelSrv} />;
};

export default DashboardListPageWrapper;
