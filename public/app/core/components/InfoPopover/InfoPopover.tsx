/**
 * InfoPopover
 *
 * React port of the infoPopover Angular directive (components/info_popover.ts).
 * Replaces tether-drop with the existing Tooltip/Popover React component
 * already in the codebase.
 *
 * Usage:
 *   <InfoPopover>This is the help text</InfoPopover>
 *   <InfoPopover mode="right-normal" position="top center">...</InfoPopover>
 *   <InfoPopover wide>Long help text that needs more space</InfoPopover>
 */

import React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';

export interface InfoPopoverProps {
  /** Additional mode class: 'right-normal', etc. */
  mode?: string;
  /** Tooltip placement, passed to Tooltip component */
  placement?: string;
  /** Render a wider popover */
  wide?: boolean;
  children: React.ReactNode;
}

const InfoPopover: React.FC<InfoPopoverProps> = ({
  mode,
  placement = 'right',
  wide = false,
  children,
}) => {
  const iconClass = [
    'gf-form-help-icon',
    mode ? `gf-form-help-icon--${mode}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={`markdown-html${wide ? ' drop-wide' : ''}`}>
      {children}
    </div>
  );

  return (
    <Tooltip content={content} placement={placement as any}>
      <i className={`fa fa-info-circle ${iconClass}`} />
    </Tooltip>
  );
};

export default InfoPopover;
