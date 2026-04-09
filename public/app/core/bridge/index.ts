/**
 * Bridge index — single import point for all Angular↔React bridging.
 *
 * Also pre-instantiates angular2React wrappers for Angular directives that
 * are consumed inside new React parent components during migration.
 *
 * Removal checklist per entry:
 *   1. The Angular directive is fully replaced by a React component ✅
 *   2. The Angular directive registration is removed from its .ts file ✅
 *   3. No .html template references the old directive element name ✅
 *   → Then remove the angular2React entry here and delete the Angular file.
 */

export { react2AngularDirective } from './react2angular';
export { angular2React } from './angular2react';

import { angular2React } from './angular2react';
import { NavModel } from 'app/types';

// ---------------------------------------------------------------------------
// Pre-wrapped Angular directives for React parent consumption
// ---------------------------------------------------------------------------

// ✅ navbar — React Navbar now exists; AngularNavbar kept only for any
//    remaining React parents that haven't switched to <Navbar> yet.
/** @deprecated Use Navbar from app/core/components/Navbar/Navbar instead */
interface NavbarProps { model: NavModel; }
export const AngularNavbar = angular2React<NavbarProps>('navbar', ['model']);

// valueSelectDropdown — Angular only, wrap for use in React parents
interface ValueSelectDropdownProps {
  variable: any;
  onUpdated: () => void;
}
export const AngularValueSelectDropdown = angular2React<ValueSelectDropdownProps>(
  'value-select-dropdown',
  ['variable', 'onUpdated']
);

// metricSegment — Angular only
interface MetricSegmentProps {
  segment: any;
  getOptions: (query: string) => Promise<any[]>;
  onChange: () => void;
}
export const AngularMetricSegment = angular2React<MetricSegmentProps>('metric-segment', [
  'segment',
  'getOptions',
  'onChange',
]);

// formDropdown — Angular only
interface FormDropdownProps {
  model: any;
  getOptions: () => Promise<any[]>;
  onChange: (value: any) => void;
  cssClass?: string;
  placeholder?: string;
}
export const AngularFormDropdown = angular2React<FormDropdownProps>('form-dropdown', [
  'model',
  'getOptions',
  'onChange',
  'cssClass',
  'placeholder',
]);
