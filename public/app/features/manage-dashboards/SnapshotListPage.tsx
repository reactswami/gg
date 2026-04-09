/**
 * SnapshotListPage
 *
 * React page replacing SnapshotListCtrl + snapshot_list.html.
 * Route: /dashboard/snapshots
 */

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import { DeleteButton } from 'app/core/components/DeleteButton/DeleteButton';
import { useAngularService } from 'app/core/hooks/useAngularService';

interface Snapshot {
  key: string;
  name: string;
}

const SnapshotListPage: React.FC = () => {
  const navModelSrv = useAngularService('navModelSrv');
  const backendSrv = useAngularService<any>('backendSrv');

  const [navModel] = useState(() => navModelSrv.getNav('dashboards', 'snapshots', 0));
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    backendSrv.get('/api/dashboard/snapshots').then(setSnapshots);
  }, [backendSrv]);

  const removeSnapshot = useCallback(
    async (snapshot: Snapshot) => {
      setSnapshots(prev => prev.filter(s => s.key !== snapshot.key));
      try {
        await backendSrv.delete('/api/snapshots/' + snapshot.key);
      } catch {
        // Restore on failure
        setSnapshots(prev => [...prev, snapshot]);
      }
    },
    [backendSrv]
  );

  return (
    <>
      <PageHeader model={navModel} />
      <div className="page-container page-body">
        <table className="filter-table">
          <thead>
            <tr>
              <th><strong>Name</strong></th>
              <th><strong>Snapshot url</strong></th>
              <th style={{ width: 70 }} />
              <th style={{ width: 25 }} />
            </tr>
          </thead>
          <tbody>
            {snapshots.map(snapshot => (
              <tr key={snapshot.key}>
                <td>
                  <a href={`dashboard/snapshot/${snapshot.key}`}>{snapshot.name}</a>
                </td>
                <td>
                  <a href={`dashboard/snapshot/${snapshot.key}`}>
                    {`dashboard/snapshot/${snapshot.key}`}
                  </a>
                </td>
                <td className="text-center">
                  <a
                    href={`dashboard/snapshot/${snapshot.key}`}
                    className="btn btn-inverse btn-mini"
                  >
                    <i className="fa fa-eye" /> View
                  </a>
                </td>
                <td className="text-right">
                  <DeleteButton onConfirm={() => removeSnapshot(snapshot)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SnapshotListPage;
