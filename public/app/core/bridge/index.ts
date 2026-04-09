/**
 * Bridge index
 *
 * Single import point for anything bridge-related.
 * Also pre-instantiates angular2React wrappers for every Angular directive
 * that is being progressively consumed by new React code.
 *
 * As a directive is fully rewritten in React:
 *   1. Remove its entry from the angular2React block below.
 *   2. Remove its entry from angular_wrappers.ts (react2AngularDirective).
 *   3. Delete the original .ts directive file.
 */

export { react2AngularDirective } from './react2angular';
export { angular2React } from './angular2react';

// ---------------------------------------------------------------------------
// Pre-wrapped Angular directives for consumption by React parents
//
// Add entries here as you write new React components that need to render
// existing Angular children.  Remove entries once the child is rewritten.
// ---------------------------------------------------------------------------

import { angular2React } from './angular2react';
import { NavModel } from 'app/types';

// --- Navbar ------------------------------------------------------------------
interface NavbarProps {
  model: NavModel;
}
/** @deprecated Use the React Navbar component once it is available */
export const AngularNavbar = angular2React<NavbarProps>('navbar', ['model']);

// --- ValueSelectDropdown -----------------------------------------------------
interface ValueSelectDropdownProps {
  variable: any;
  onUpdated: () => void;
}
/** @deprecated Use the React ValueSelectDropdown once it is available */
export const AngularValueSelectDropdown = angular2React<ValueSelectDropdownProps>(
  'value-select-dropdown',
  ['variable', 'onUpdated']
);

// --- MetricSegment -----------------------------------------------------------
interface MetricSegmentProps {
  segment: any;
  getOptions: (query: string) => Promise<any[]>;
  onChange: () => void;
}
/** @deprecated Use the React MetricSegment once it is available */
export const AngularMetricSegment = angular2React<MetricSegmentProps>('metric-segment', [
  'segment',
  'getOptions',
  'onChange',
]);

// --- FormDropdown ------------------------------------------------------------
interface FormDropdownProps {
  model: any;
  getOptions: () => Promise<any[]>;
  onChange: (value: any) => void;
  cssClass?: string;
  placeholder?: string;
}
/** @deprecated Use react-select or a React equivalent */
export const AngularFormDropdown = angular2React<FormDropdownProps>('form-dropdown', [
  'model',
  'getOptions',
  'onChange',
  'cssClass',
  'placeholder',
]);
