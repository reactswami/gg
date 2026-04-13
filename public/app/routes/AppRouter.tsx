/**
 * AppRouter
 *
 * React-router-dom v5 router that runs alongside Angular's ngRoute during
 * the incremental migration. It handles routes registered in routeRegistry.ts
 * while Angular continues to handle routes still in setupAngularRoutes().
 *
 * Coexistence strategy
 * --------------------
 * Angular's <ng-view> is the legacy outlet. The React router renders into a
 * separate <div id="react-router-outlet"> injected before <ng-view> by
 * AppRouterMount (see below). When a React route matches, it renders its
 * page component there AND hides <ng-view> so Angular doesn't interfere.
 * When no React route matches, the div is empty and Angular's <ng-view>
 * renders as normal.
 *
 * Page-class body management
 * --------------------------
 * Angular's $routeChangeSuccess sets body pageClass. For React routes we
 * use the usePageClass hook to do the same thing declaratively.
 *
 * Mount point
 * -----------
 * Add <app-router-mount></app-router-mount> once in the main HTML template
 * (index.html, before <ng-view>). It is registered as an Angular directive
 * in angular_wrappers.ts so no Webpack entry change is needed.
 */

import React, { Suspense, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Switch,
  Route,
  useLocation,
  useHistory,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'app/store/configureStore';
import { REACT_ROUTES, ReactRoute } from './routeRegistry';
import { contextSrv } from 'app/core/services/context_srv';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Apply/remove a CSS class on <body> for the lifetime of the component */
function usePageClass(pageClass?: string) {
  useEffect(() => {
    if (!pageClass) return;
    document.body.classList.add(pageClass);
    return () => document.body.classList.remove(pageClass);
  }, [pageClass]);
}

/** Hide/show the Angular ng-view outlet */
function setAngularViewVisible(visible: boolean) {
  const ngView = document.querySelector('[ng-view]') as HTMLElement | null;
  if (ngView) {
    ngView.style.display = visible ? '' : 'none';
  }
}

// ---------------------------------------------------------------------------
// RouteGuard - enforces role-based access
// ---------------------------------------------------------------------------

interface RouteGuardProps {
  roles?: string[];
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ roles, children }) => {
  const history = useHistory();

  useEffect(() => {
    if (roles && roles.length && !roles.some(r => contextSrv.hasRole(r))) {
      history.replace('/');
    }
  }, [roles, history]);

  if (roles && roles.length && !roles.some(r => contextSrv.hasRole(r))) {
    return null;
  }

  return <>{children}</>;
};

// ---------------------------------------------------------------------------
// PageClassSetter - sets body class and hides ng-view for active React routes
// ---------------------------------------------------------------------------

const PageClassSetter: React.FC<{ route: ReactRoute }> = ({ route }) => {
  usePageClass(route.pageClass);

  useEffect(() => {
    setAngularViewVisible(false);
    return () => setAngularViewVisible(true);
  }, []);

  return null;
};

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

const PageLoader: React.FC = () => (
  <div className="page-loader">
    <div className="page-loader__spinner" />
  </div>
);

// ---------------------------------------------------------------------------
// Inner router - has access to useLocation / useHistory
// ---------------------------------------------------------------------------

const InnerRouter: React.FC = () => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  // Emit location-change on navigation so Angular services that listen to it
  // (e.g. breadcrumb / nav services) stay in sync during hybrid period.
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      prevLocationRef.current = location.pathname;
      appEvents.emit('location-change', {
        href: location.pathname + location.search,
      });
    }
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {REACT_ROUTES.map(route => (
          <Route
            key={route.path}
            path={route.path}
            exact={route.exact !== false}
            render={props => (
              <>
                <PageClassSetter route={route} />
                <RouteGuard roles={route.roles}>
                  <route.component
                    routeParams={props.match.params}
                    {...props}
                  />
                </RouteGuard>
              </>
            )}
          />
        ))}
      </Switch>
    </Suspense>
  );
};

// ---------------------------------------------------------------------------
// AppRouter - public component, wraps everything in BrowserRouter + Provider
// ---------------------------------------------------------------------------

const AppRouter: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter basename={config.appSubUrl || '/'}>
        <InnerRouter />
      </BrowserRouter>
    </Provider>
  );
};

export default AppRouter;
