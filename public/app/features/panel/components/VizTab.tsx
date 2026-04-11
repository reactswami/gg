/**
 * VizTab
 *
 * React port of VizTabCtrl + template (features/panel/viz_tab.ts).
 * Replaces Angular directive: <viz-tab> (scope: true)
 *
 * VizTypePicker is already React — this just wraps it in the correct
 * panel tab shell and wires it to panelCtrl.
 */

import React, { useCallback } from 'react';
import { VizTypePicker } from 'app/features/dashboard/dashgrid/VizTypePicker';
import { PanelPlugin } from 'app/types/plugins';

export interface VizTabProps {
  panelCtrl: any;
}

const VizTab: React.FC<VizTabProps> = ({ panelCtrl }) => {
  const onTypeChanged = useCallback((plugin: PanelPlugin) => {
    panelCtrl?.onPluginTypeChange?.(plugin);
  }, [panelCtrl]);

  return (
    <div className="gf-form-group">
      <VizTypePicker
        currentType={panelCtrl?.panel?.type}
        onTypeChanged={onTypeChanged}
      />
    </div>
  );
};

export default VizTab;
