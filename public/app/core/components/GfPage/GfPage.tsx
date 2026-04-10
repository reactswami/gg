/**
 * GfPage
 *
 * React port of gfPageDirective (components/gf_page.ts).
 * Provides the standard page shell: scrollbar canvas, navbar, page header,
 * and transcluded body slot.
 *
 * Usage:
 *   <GfPage model={navModel}>
 *     <GfPageHeader>
 *       <button>Action</button>
 *     </GfPageHeader>
 *     <GfPageBody>
 *       <p>Page content here</p>
 *     </GfPageBody>
 *   </GfPage>
 */

import React from 'react';
import Navbar from '../Navbar/Navbar';
import { NavModel } from 'app/types';

// ---------------------------------------------------------------------------
// Slot components (replaces ng-transclude slots)
// ---------------------------------------------------------------------------

export const GfPageHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const GfPageBody: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// ---------------------------------------------------------------------------
// GfPage
// ---------------------------------------------------------------------------

interface GfPageProps {
  model: NavModel;
  children?: React.ReactNode;
}

const GfPage: React.FC<GfPageProps> = ({ model, children }) => {
  // Extract named slots from children
  const childArray = React.Children.toArray(children);

  const headerSlot = childArray.find(
    child => React.isValidElement(child) && child.type === GfPageHeader
  );
  const bodySlot = childArray.find(
    child => React.isValidElement(child) && child.type === GfPageBody
  );

  const node = model?.node;

  return (
    <div className="scroll-canvas">
      <Navbar model={model} />
      <div className="page-container">
        <div className="page-header">
          <h1>
            {node?.icon && <i className={node.icon} />}
            {node?.img && <img src={node.img} alt="" />}
            {node?.text}
          </h1>
          {headerSlot && (
            <div className="page-header__actions">
              {(headerSlot as React.ReactElement).props.children}
            </div>
          )}
        </div>

        <div className="page-body">
          {bodySlot
            ? (bodySlot as React.ReactElement).props.children
            : childArray.filter(c => c !== headerSlot)}
        </div>
      </div>
    </div>
  );
};

export default GfPage;
