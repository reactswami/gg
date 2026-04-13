import React from 'react';
import SearchPanel from '../Search/SearchPanel';
import { NavModel } from 'app/types';

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
  if (!model) {
    return null;
  }

  const breadcrumbs: Array<{ text: string; url: string }> =
    (model.main as any).breadcrumbs || [];

  return (
    <div className="page-nav">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      {/* SearchPanel listens for show-dash-search / hide-dash-search appEvents internally */}
      <SearchPanel />
    </div>
  );
};

export default Navbar;
