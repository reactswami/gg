import React, { useCallback } from 'react';
import SearchPanel from '../Search/SearchPanel';
import { NavModel, NavModelItem } from 'app/types';
import { useEmitAppEvent } from 'app/core/hooks/useAppEvents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavbarProps {
  model: NavModel;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BreadcrumbProps {
  breadcrumbs: Array<{ text: string; url: string }>;
}

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ breadcrumbs }) => (
  <div className="page-breadcrumbs">
    <a className="breadcrumb-item active" href="/">
      <i className="fa fa-home" />
    </a>
    {breadcrumbs.map((item, i) => (
      <a key={i} className="breadcrumb-item" href={item.url}>
        {item.text}
      </a>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Main Navbar component
// ---------------------------------------------------------------------------

const Navbar: React.FC<NavbarProps> = ({ model }) => {
  const emitShowSearch = useEmitAppEvent('show-dash-search');

  const handleNavItemClick = useCallback(
    (navItem: NavModelItem, evt: React.MouseEvent) => {
      if (navItem.clickHandler) {
        (navItem as any).clickHandler();
        evt.preventDefault();
      }
    },
    []
  );

  if (!model) {
    return null;
  }

  const breadcrumbs: Array<{ text: string; url: string }> =
    (model.main as any).breadcrumbs || [];

  return (
    <div className="page-nav">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <SearchPanel />
    </div>
  );
};

// SearchPanel is the fully ported React version of search.ts + search.html.
// It listens for 'show-dash-search' on appEvents internally.
// No placeholder or custom element declaration needed.

export default Navbar;
