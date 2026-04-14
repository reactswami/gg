/**
 * react2angular bridge
 *
 * Drop-in replacement for the existing app/core/utils/react2angular.ts.
 * Wraps any React component as an AngularJS directive, forwarding props,
 * wiring up the Redux store, and cleaning up on scope destroy.
 *
 * Usage (same API as before, nothing in angular_wrappers.ts needs to change):
 *
 *   react2AngularDirective('myWidget', MyWidget, ['propA', 'propB']);
 *
 * Extended usage with watch options (also backwards-compatible):
 *
 *   react2AngularDirective('tagFilter', TagFilter, [
 *     'tags',
 *     ['onChange', { watchDepth: 'reference' }],
 *   ]);
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import angular from 'angular';

import coreModule from 'app/core/core_module';
import { store } from 'app/store/configureStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WatchDepth = 'reference' | 'collection' | 'value' | 'one-time';

interface PropConfig {
  watchDepth?: WatchDepth;
  wrapApply?: boolean;
}

type PropDefinition = string | [string, PropConfig];

// ---------------------------------------------------------------------------
// Helpers (ported + cleaned up from ng_react service so the bridge is
// self-contained and doesn't depend on the legacy ng_react angular service)
// ---------------------------------------------------------------------------

function getPropName(prop: PropDefinition): string {
  return Array.isArray(prop) ? prop[0] : prop;
}

function getPropConfig(prop: PropDefinition): PropConfig {
  return Array.isArray(prop) ? prop[1] : {};
}

/** Wraps a callback so it triggers an Angular digest when called from React */
function wrapWithApply(fn: Function, scope: angular.IScope): Function {
  if ((fn as any).__bridgeWrapped) {
    return fn;
  }
  const wrapped: any = (...args: any[]) => {
    const phase = scope.$root.$$phase;
    if (phase === '$apply' || phase === '$digest') {
      return fn(...args);
    }
    return scope.$apply(() => fn(...args));
  };
  wrapped.__bridgeWrapped = true;
  return wrapped;
}

/** Wraps all function-valued props so React->Angular callbacks trigger digests */
function applyFunctions(
  props: Record<string, any>,
  scope: angular.IScope,
  configs: Record<string, PropConfig>
): Record<string, any> {
  return Object.keys(props).reduce<Record<string, any>>((acc, key) => {
    const value = props[key];
    const config = configs[key] || {};
    acc[key] =
      typeof value === 'function' && config.wrapApply !== false
        ? wrapWithApply(value, scope)
        : value;
    return acc;
  }, {});
}

/** Sets up scope watchers according to the watchDepth for each prop */
function watchProps(
  defaultDepth: WatchDepth,
  scope: angular.IScope,
  propDefs: PropDefinition[],
  attrs: angular.IAttributes,
  listener: () => void
): void {
  const groupExpressions: string[] = [];

  propDefs.forEach((prop) => {
    const name = getPropName(prop);
    const config = getPropConfig(prop);
    const depth: WatchDepth = config.watchDepth || defaultDepth;
    const expr = attrs[name];

    if (!expr) {
      return;
    }

    switch (depth) {
      case 'one-time':
        // Handled by a single listener call below
        break;
      case 'collection':
        scope.$watchCollection(expr, listener);
        break;
      case 'reference':
        groupExpressions.push(expr);
        break;
      default:
        // 'value' -- deep watch
        scope.$watch(expr, listener, true);
    }
  });

  if (defaultDepth === 'one-time') {
    listener();
  }

  if (groupExpressions.length) {
    scope.$watchGroup(groupExpressions, listener);
  }
}

// ---------------------------------------------------------------------------
// Core bridge function
// ---------------------------------------------------------------------------

/**
 * Registers a React component as an AngularJS directive on coreModule.
 *
 * @param directiveName  camelCase directive name (Angular converts to kebab-case in templates)
 * @param Component      React component (class or function)
 * @param propDefs       Array of prop names or [name, config] tuples to watch and pass as props
 * @param withStore      Whether to wrap the component in a Redux <Provider> (default: true)
 */
export function react2AngularDirective(
  directiveName: string,
  Component: React.ComponentType<any>,
  propDefs: PropDefinition[] = [],
  withStore = true
): void {
  coreModule.directive(directiveName, () => ({
    restrict: 'E',
    replace: true,

    // Isolate scope: declare one two-way binding per prop so Angular's
    // attribute normalisation picks them up automatically.
    scope: propDefs.reduce<Record<string, string>>((acc, prop) => {
      acc[getPropName(prop)] = '=';
      return acc;
    }, {}),

    link(scope: angular.IScope, elem: angular.IAugmentedJQuery, attrs: angular.IAttributes) {
      const configs = propDefs.reduce<Record<string, PropConfig>>((acc, prop) => {
        acc[getPropName(prop)] = getPropConfig(prop);
        return acc;
      }, {});

      // Collect current prop values from the isolated scope.
      // Angular '=' bindings copy values from the parent scope. For function
      // references (e.g. ctrl.getTags), this works IF the parent scope has
      // already evaluated. On first link() call there can be a timing gap.
      // We always try $parent.$eval first so function references are resolved
      // immediately without waiting for the watcher cycle.
      const collectProps = (): Record<string, any> => {
        const raw = propDefs.reduce<Record<string, any>>((acc, prop) => {
          const name = getPropName(prop);
          let value = (scope as any)[name];
          // Always try parent evaluation for attrs -- this correctly resolves
          // function references like "ctrl.getTags" to the actual function.
          if (attrs[name]) {
            try {
              const parentVal = (scope.$parent as any).$eval(attrs[name]);
              // Prefer parent eval: it handles function refs and keeps them live.
              // Only fall back to scope[name] if parent eval gives undefined.
              if (parentVal !== undefined) {
                value = parentVal;
              }
            } catch (e) {
              // Expression not evaluable in parent scope -- use scope value
            }
          }
          acc[name] = value;
          return acc;
        }, {});
        return applyFunctions(raw, scope, configs);
      };

      // (Re-)render the React tree into the directive element
      const render = (): void => {
        const props = collectProps();
        const tree = withStore ? (
          <Provider store={store}>
            <Component {...props} />
          </Provider>
        ) : (
          <Component {...props} />
        );

        scope.$evalAsync(() => {
          ReactDOM.render(tree, elem[0]);
        });
      };

      // Set up watchers (skip if no props declared)
      if (propDefs.length > 0) {
        watchProps('value', scope, propDefs, attrs, render);
      } else {
        render();
      }

      // Cleanup: unmount React component when the Angular scope is destroyed
      scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(elem[0]);
      });
    },
  }));
}
