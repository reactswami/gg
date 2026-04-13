/**
 * angular2react bridge
 *
 * Wraps any existing AngularJS directive as a React component so that
 * newly-written React parent components can render Angular children
 * during the incremental migration -- without having to rewrite both
 * parent and child at the same time.
 *
 * Usage:
 *
 *   // Once, near your app entry (or in a dedicated wrappers file):
 *   export const NavbarReact = angular2React<NavbarProps>('navbar', ['model']);
 *
 *   // Then in JSX:
 *   <NavbarReact model={navModel} />
 *
 * How it works:
 *   1. React renders an empty <div> container.
 *   2. On mount, we bootstrap a minimal Angular child scope, compile the
 *      directive element into that scope, and link it to the container div.
 *   3. On each prop change, we update the child scope and trigger a digest.
 *   4. On unmount, we destroy the child scope and clean up.
 *
 * Requirements:
 *   - The global Angular app must already be bootstrapped (angular.bootstrap
 *     has been called). This is always true in this codebase because
 *     GrafanaApp.init() runs before any React rendering.
 *   - The directive must already be registered on coreModule (or any module
 *     included in the main app).
 */

import React, { Component, createRef } from 'react';
import angular from 'angular';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PropNames<P> = Array<keyof P & string>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns a React component class that mounts the given AngularJS directive.
 *
 * @param directiveName  The directive element name in kebab-case (e.g. 'navbar')
 * @param propNames      Props to forward to the Angular scope (must match
 *                       the directive's `scope` bindings)
 */
export function angular2React<P extends Record<string, any>>(
  directiveName: string,
  propNames: PropNames<P>
): React.ComponentClass<P> {
  return class AngularWrapper extends Component<P> {
    private containerRef = createRef<HTMLDivElement>();
    private childScope: angular.IScope | null = null;

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    componentDidMount() {
      this.mountAngular();
    }

    componentDidUpdate(prevProps: P) {
      // Only push changed props to avoid unnecessary digests
      if (this.childScope) {
        let changed = false;
        propNames.forEach((name) => {
          if (prevProps[name] !== this.props[name]) {
            (this.childScope as any)[name] = this.props[name];
            changed = true;
          }
        });
        if (changed) {
          this.triggerDigest();
        }
      }
    }

    componentWillUnmount() {
      if (this.childScope) {
        this.childScope.$destroy();
        this.childScope = null;
      }
      if (this.containerRef.current) {
        // Remove compiled Angular DOM to avoid memory leaks
        angular.element(this.containerRef.current).empty();
      }
    }

    // ------------------------------------------------------------------
    // Angular mounting
    // ------------------------------------------------------------------

    private mountAngular(): void {
      const container = this.containerRef.current;
      if (!container) {
        return;
      }

      // Grab the $injector from the already-bootstrapped app
      const $injector = angular.element(document).injector();
      if (!$injector) {
        console.error(
          `[angular2React] Cannot find Angular $injector. ` +
          `Make sure GrafanaApp.init() has been called before mounting <${directiveName}>.`
        );
        return;
      }

      $injector.invoke([
        '$compile',
        '$rootScope',
        ($compile: angular.ICompileService, $rootScope: angular.IRootScopeService) => {
          // Create an isolated child scope so we don't pollute $rootScope
          this.childScope = $rootScope.$new(true);

          // Seed the scope with current prop values
          propNames.forEach((name) => {
            (this.childScope as any)[name] = this.props[name];
          });

          // Build the directive element with attribute bindings
          const attrBindings = propNames
            .map((name) => `${camelToKebab(name)}="${name}"`)
            .join(' ');
          const template = `<${directiveName} ${attrBindings}></${directiveName}>`;

          // Compile and link into the container
          const compiled = $compile(template)(this.childScope!);
          angular.element(container).append(compiled);

          // Run the first digest to paint the initial state
          this.triggerDigest();
        },
      ]);
    }

    private triggerDigest(): void {
      if (!this.childScope) {
        return;
      }
      const phase = this.childScope.$root.$$phase;
      if (phase !== '$apply' && phase !== '$digest') {
        this.childScope.$digest();
      }
    }

    // ------------------------------------------------------------------
    // Render -- just a plain div that Angular will populate
    // ------------------------------------------------------------------

    render() {
      return <div ref={this.containerRef} />;
    }
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}
