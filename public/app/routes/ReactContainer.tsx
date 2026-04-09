/**
 * ReactContainer directive
 *
 * Angular directive used by the router to render full-page React components.
 * Routes opt in via:
 *
 *   .when('/some/path', {
 *     template: '<react-container />',
 *     resolve: { component: () => import('app/features/foo/FooPage') },
 *   })
 *
 * Changes vs original:
 *   - Uses ReactDOM.createRoot (React 18) with a graceful fallback to the
 *     legacy ReactDOM.render for environments still on React 17 during CI.
 *   - Accepts an optional `roles` resolve value for permission-gating.
 *   - Cleans up the React root properly on scope destroy.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import coreModule from 'app/core/core_module';
import { store } from 'app/store/configureStore';
import { BackendSrv } from 'app/core/services/backend_srv';
import { DatasourceSrv } from 'app/features/plugins/datasource_srv';
import { ContextSrv } from 'app/core/services/context_srv';

// ---------------------------------------------------------------------------
// React 18 createRoot with React 17 fallback
// ---------------------------------------------------------------------------

type ReactRoot = { render: (el: React.ReactElement) => void; unmount: () => void };

function createReactRoot(container: Element): ReactRoot {
  // React 18 path
  if ((ReactDOM as any).createRoot) {
    const root = (ReactDOM as any).createRoot(container);
    return {
      render: (el) => root.render(el),
      unmount: () => root.unmount(),
    };
  }

  // React 17 fallback (remove once fully on React 18)
  return {
    render: (el) => ReactDOM.render(el, container),
    unmount: () => ReactDOM.unmountComponentAtNode(container),
  };
}

// ---------------------------------------------------------------------------
// Directive
// ---------------------------------------------------------------------------

/** @ngInject */
export function reactContainer(
  $route: any,
  $location: angular.ILocationService,
  backendSrv: BackendSrv,
  datasourceSrv: DatasourceSrv,
  contextSrv: ContextSrv
) {
  return {
    restrict: 'E',
    template: '',
    link(scope: angular.IScope, elem: angular.IAugmentedJQuery) {
      const { roles, component: resolvedComponent } = $route.current.locals;

      // Permission gate
      if (roles && roles.length) {
        if (!roles.some((r: string) => contextSrv.hasRole(r))) {
          $location.url('/');
          return;
        }
      }

      // Dynamic imports return the whole module — extract default export
      const Component = resolvedComponent?.default ?? resolvedComponent;

      const props = {
        backendSrv,
        datasourceSrv,
        routeParams: $route.current.params,
      };

      const tree = (
        <Provider store={store}>
          <Component {...props} />
        </Provider>
      );

      const root = createReactRoot(elem[0]);
      root.render(tree);

      scope.$on('$destroy', () => {
        root.unmount();
      });
    },
  };
}

coreModule.directive('reactContainer', reactContainer);
