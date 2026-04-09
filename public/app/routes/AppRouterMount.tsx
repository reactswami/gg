/**
 * AppRouterMount
 *
 * Thin Angular directive that bootstraps the React router into the page.
 * Registered as <app-router-mount> in angular_wrappers.ts.
 *
 * Add this once to index.html, immediately before <ng-view>:
 *
 *   <app-router-mount></app-router-mount>
 *   <div ng-view></div>
 *
 * The React router renders into the element this directive creates.
 * When a React route is active it hides <ng-view>; when no React route
 * matches it does nothing and Angular renders as normal.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import angular from 'angular';
import coreModule from 'app/core/core_module';
import AppRouter from './AppRouter';

/** @ngInject */
export function appRouterMountDirective() {
  return {
    restrict: 'E',
    link(_scope: angular.IScope, elem: angular.IAugmentedJQuery) {
      // Create a plain div container inside the directive element
      const container = document.createElement('div');
      container.id = 'react-router-outlet';
      elem[0].appendChild(container);

      // Mount the React router tree
      ReactDOM.render(<AppRouter />, container);

      // Cleanup on scope destroy (e.g. hot-reload)
      _scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(container);
      });
    },
  };
}

coreModule.directive('appRouterMount', appRouterMountDirective);
