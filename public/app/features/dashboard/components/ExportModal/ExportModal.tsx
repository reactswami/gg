/**
 * ExportModal
 *
 * React port of DashExportCtrl + export_modal.html.
 * Replaces Angular directive: <dash-export-modal dismiss="...">
 *
 * Renders inside the existing Angular modal system via show-modal appEvent.
 */

import React, { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { useAngularService } from 'app/core/hooks/useAngularService';
import appEvents from 'app/core/app_events';

export interface ExportModalProps {
  dismiss: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ dismiss }) => {
  const dashboardSrv  = useAngularService<any>('dashboardSrv');
  const datasourceSrv = useAngularService<any>('datasourceSrv');

  const [shareExternally, setShareExternally] = useState(false);

  const dash = dashboardSrv.getCurrent();

  // -- Helpers ----------------------------------------------------------------

  const applyExportDefaults = useCallback((d: any) => {
    d.uid = d.uid.replace('StatseekerDefault', '');
    const res = /(.*) Copy( ?([\d]+))?$/.exec(d.title);
    if (res === null) {
      d.title += ' Copy';
    } else if (res[3]) {
      d.title = res[1] + ' Copy ' + (1 + parseInt(res[3], 10));
    } else {
      d.title = res[1] + ' Copy 2';
    }
    d.editable = true;
    return d;
  }, []);

  const saveDashboardAsFile = useCallback(async () => {
    let exportDash: any;

    if (shareExternally) {
      const { DashboardExporter } = await import(
        'app/features/dashboard/export/exporter'
      );
      const exporter = new DashboardExporter(datasourceSrv);
      exportDash = applyExportDefaults(await exporter.makeExportable(dash));
    } else {
      exportDash = applyExportDefaults(dash.getSaveModelClone());
    }

    const blob = new Blob([JSON.stringify(exportDash, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    saveAs(blob, `${exportDash.title}-${Date.now()}.json`);
  }, [shareExternally, dash, datasourceSrv, applyExportDefaults]);

  const viewJson = useCallback(async () => {
    let exportDash: any;

    if (shareExternally) {
      const { DashboardExporter } = await import(
        'app/features/dashboard/export/exporter'
      );
      const exporter = new DashboardExporter(datasourceSrv);
      exportDash = applyExportDefaults(await exporter.makeExportable(dash));
    } else {
      exportDash = applyExportDefaults(dash.getSaveModelClone());
    }

    appEvents.emit('show-modal', {
      src: 'public/app/partials/edit_json.html',
      model: { object: exportDash, enableCopy: true },
    });
    dismiss();
  }, [shareExternally, dash, datasourceSrv, applyExportDefaults, dismiss]);

  // -- Render -----------------------------------------------------------------

  return (
    <div className="share-modal-header">
      <div className="share-modal-big-icon">
        <i className="fa fa-cloud-upload" />
      </div>
      <div>
        <div className="gf-form-button-row" style={{ paddingTop: '0.5rem' }}>
          <button
            type="button"
            className="btn gf-form-btn width-10 btn-success"
            onClick={saveDashboardAsFile}
          >
            <i className="fa fa-save" /> Save to file
          </button>
          <button
            type="button"
            className="btn gf-form-btn width-10 btn-secondary"
            onClick={viewJson}
          >
            <i className="fa fa-file-text-o" /> View JSON
          </button>
          <a className="btn btn-link" onClick={dismiss}>Cancel</a>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
