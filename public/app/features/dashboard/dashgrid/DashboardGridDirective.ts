import { react2AngularDirective } from 'app/core/bridge';
import { DashboardGrid } from './DashboardGrid';

react2AngularDirective('dashboardGrid', DashboardGrid, [['dashboard', { watchDepth: 'reference' }]]);
