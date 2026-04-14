/**
 * useAngularService hook
 *
 * Lets React components access Angular services without having to rewrite
 * the services themselves -- a critical escape hatch during incremental
 * migration.
 *
 * Usage:
 *
 *   const backendSrv = useAngularService<BackendSrv>('backendSrv');
 *   const { data } = await backendSrv.get('/api/dashboards');
 *
 * --  This hook is intentionally temporary.  Once a service's callers are
 *     fully migrated to React, the service itself should be rewritten as a
 *     plain module / hook / RTK Query endpoint and this hook removed from
 *     that call site.
 */

import { useRef } from 'react';
import angular from 'angular';

// Lazily resolved injector -- retrieved once and cached for the app lifetime.
let cachedInjector: angular.auto.IInjectorService | null = null;

function getInjector(): angular.auto.IInjectorService | null {
  if (!cachedInjector) {
    cachedInjector = angular.element(document).injector() || null;
  }
  return cachedInjector;
}

/**
 * Returns an Angular service by name.
 * The returned reference is stable across re-renders (stored in a ref).
 */
export function useAngularService<T = any>(serviceName: string): T | null {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    const injector = getInjector();
    if (injector) {
      try {
        ref.current = injector.get<T>(serviceName);
      } catch (e) {
        // Service not yet registered -- will retry on next render
      }
    }
  }

  return ref.current;
}

// ---------------------------------------------------------------------------
// Convenience wrappers for the most commonly used services
// (Remove each as the corresponding service is rewritten in TypeScript/React)
// ---------------------------------------------------------------------------

import { BackendSrv } from 'app/core/services/backend_srv';
import { DatasourceSrv } from 'app/features/plugins/datasource_srv';
import { ContextSrv } from 'app/core/services/context_srv';

/** @deprecated Migrate call sites to use axios/RTK Query directly */
export const useBackendSrv = (): BackendSrv => useAngularService<BackendSrv>('backendSrv');

/** @deprecated Migrate call sites to use the React datasource registry */
export const useDatasourceSrv = (): DatasourceSrv =>
  useAngularService<DatasourceSrv>('datasourceSrv');

/** @deprecated Migrate call sites to use the Redux contextSrv slice */
export const useContextSrv = (): ContextSrv => useAngularService<ContextSrv>('contextSrv');
