/**
 * ProfilePage
 *
 * React page replacing ProfileCtrl + profile.html.
 * Route: /profile
 */

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import { SharedPreferences } from 'app/core/components/SharedPreferences/SharedPreferences';
import { useAngularService } from 'app/core/hooks/useAngularService';
import config from 'app/core/config';

interface User {
  login: string;
  name: string;
  email: string;
  theme: string;
}

interface Org {
  orgId: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
}

const ProfilePage: React.FC = () => {
  const navModelSrv = useAngularService('navModelSrv');
  const backendSrv  = useAngularService<any>('backendSrv');
  const contextSrv  = useAngularService<any>('contextSrv');

  const [navModel]   = useState(() => navModelSrv.getNav('dashboards', 'profile-settings', 0));
  const [user, setUser]     = useState<User | null>(null);
  const [orgs, setOrgs]     = useState<Org[]>([]);
  const [teams, setTeams]   = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // ── Load data on mount ────────────────────────────────────────────────────

  useEffect(() => {
    backendSrv.get('/api/user').then((u: User) => {
      setUser({ ...u, theme: u.theme || 'dark' });
    });
    backendSrv.get('/api/user/teams').then(setTeams);
    backendSrv.get('/api/user/orgs').then(setOrgs);
  }, [backendSrv]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = useCallback((field: keyof User, value: string) => {
    setUser(u => u ? { ...u, [field]: value } : u);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const oldTheme = user.theme;
      await backendSrv.put('/api/user/', user);
      contextSrv.user.name = user.name || user.login;
      if (oldTheme !== user.theme) {
        window.location.href = config.appSubUrl + '/profile';
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [user, backendSrv, contextSrv]);

  const handleSwitchOrg = useCallback(
    async (org: Org) => {
      await backendSrv.post('/api/user/using/' + org.orgId);
      window.location.href = config.appSubUrl + '/profile';
    },
    [backendSrv]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) {
    return <PageHeader model={navModel} />;
  }

  const readonlyLogin = config.disableLoginForm;

  return (
    <>
      <PageHeader model={navModel} />

      <div className="page-container page-body">
        {/* ── Basic info form ─────────────────────────────────────────────── */}
        <div className="gf-form-group">
          <h3 className="page-sub-heading">Edit profile</h3>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="gf-form">
            <label className="gf-form-label width-10">Name</label>
            <input
              className="gf-form-input max-width-22"
              type="text"
              value={user.name}
              onChange={e => handleChange('name', e.target.value)}
              disabled={readonlyLogin}
            />
          </div>
          <div className="gf-form">
            <label className="gf-form-label width-10">Email</label>
            <input
              className="gf-form-input max-width-22"
              type="email"
              value={user.email}
              onChange={e => handleChange('email', e.target.value)}
              disabled={readonlyLogin}
            />
          </div>
          <div className="gf-form">
            <label className="gf-form-label width-10">Username</label>
            <input
              className="gf-form-input max-width-22"
              type="text"
              value={user.login}
              onChange={e => handleChange('login', e.target.value)}
              disabled={readonlyLogin}
            />
          </div>

          <div className="gf-form-button-row">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Preferences ─────────────────────────────────────────────────── */}
        <SharedPreferences resourceUri="user" />

        {/* ── Teams ───────────────────────────────────────────────────────── */}
        {teams.length > 0 && (
          <div className="gf-form-group">
            <h3 className="page-sub-heading">Teams</h3>
            <table className="filter-table">
              <thead>
                <tr><th>Name</th></tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Organizations ───────────────────────────────────────────────── */}
        {orgs.length > 1 && (
          <div className="gf-form-group">
            <h3 className="page-sub-heading">Organizations</h3>
            <table className="filter-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {orgs.map(org => (
                  <tr key={org.orgId}>
                    <td>{org.name}</td>
                    <td>
                      <button
                        className="btn btn-inverse btn-mini"
                        onClick={() => handleSwitchOrg(org)}
                      >
                        Switch to
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;
