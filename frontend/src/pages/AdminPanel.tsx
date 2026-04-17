import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, toggleUser, resetPassword, registerUser, getAuditLogs } from '../services/api';
import type { AppUserRecord, AuditLogEntry, UserRole } from '../types';

type AdminTab = 'users' | 'audit';

const ROLE_COLORS: Record<UserRole, { bg: string; color: string }> = {
  ADMIN:  { bg: '#fef2f2', color: '#dc2626' },
  DOCTOR: { bg: '#eff6ff', color: '#1d4ed8' },
  STAFF:  { bg: '#f0fdf4', color: '#16a34a' },
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'STAFF' });
  const [resetPwUserId, setResetPwUserId] = useState<number | null>(null);
  const [newPw, setNewPw] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await getUsers()); } finally { setLoading(false); }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try { setLogs(await getAuditLogs()); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else loadLogs();
  }, [tab, loadUsers, loadLogs]);

  const handleToggle = async (u: AppUserRecord) => {
    if (u.username === user?.username) { showToast("❌ Can't disable your own account"); return; }
    await toggleUser(u.id, !u.enabled);
    showToast(`✅ ${u.username} ${u.enabled ? 'disabled' : 'enabled'}`);
    loadUsers();
  };

  const handleAddUser = async () => {
    try {
      await registerUser(newUser);
      setShowAddUser(false);
      setNewUser({ username: '', password: '', fullName: '', role: 'STAFF' });
      showToast('✅ User created successfully');
      loadUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('❌ ' + (msg || 'Failed to create user'));
    }
  };

  const handleResetPw = async () => {
    if (!resetPwUserId || newPw.length < 6) return;
    await resetPassword(resetPwUserId, newPw);
    setResetPwUserId(null);
    setNewPw('');
    showToast('✅ Password reset successfully');
  };

  const formatDt = (s: string) => {
    if (!s || s === 'Never') return 'Never';
    return new Date(s).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>⚙️ Admin Panel</h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            User management & system audit
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['users', 'audit'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.4rem 1rem' }}>
              {t === 'users' ? '👥 Users' : '📋 Audit Log'}
            </button>
          ))}
          {tab === 'users' && (
            <button className="btn btn-ghost-blue" onClick={() => setShowAddUser(v => !v)}
              style={{ fontSize: '0.78rem', padding: '0.4rem 1rem' }}>
              + Add User
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          margin: '0.75rem 1.5rem 0',
          padding: '0.6rem 1rem',
          borderRadius: 8,
          background: toast.startsWith('❌') ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.startsWith('❌') ? '#fecaca' : '#bbf7d0'}`,
          color: toast.startsWith('❌') ? '#dc2626' : '#15803d',
          fontSize: '0.82rem',
        }}>
          {toast}
        </div>
      )}

      {/* Add User Form */}
      {showAddUser && (
        <div style={{
          margin: '0.75rem 1.5rem',
          padding: '1rem',
          background: 'var(--surface-3)',
          borderRadius: 10,
          border: '1px solid var(--border)',
        }}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>New User</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
            {(['fullName', 'username', 'password'] as const).map(f => (
              <input key={f} className="input" placeholder={
                f === 'fullName' ? 'Full Name' : f === 'username' ? 'Username' : 'Password (min 6)'
              }
                type={f === 'password' ? 'password' : 'text'}
                value={newUser[f]} onChange={e => setNewUser(v => ({ ...v, [f]: e.target.value }))}
              />
            ))}
            <select className="input" value={newUser.role}
              onChange={e => setNewUser(v => ({ ...v, role: e.target.value }))}>
              <option value="STAFF">STAFF</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleAddUser}
              style={{ fontSize: '0.8rem' }} disabled={!newUser.username || !newUser.password || !newUser.fullName}>
              Create
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddUser(false)}
              style={{ fontSize: '0.8rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {resetPwUserId && (
        <div style={{
          margin: '0.75rem 1.5rem',
          padding: '1rem',
          background: '#fff7ed',
          borderRadius: 10,
          border: '1px solid #fed7aa',
        }}>
          <p style={{ margin: '0 0 0.6rem', fontWeight: 600, fontSize: '0.85rem', color: '#c2410c' }}>
            🔑 Reset Password
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input" type="password" placeholder="New password (min 6)"
              value={newPw} onChange={e => setNewPw(e.target.value)} style={{ maxWidth: 240 }} />
            <button className="btn btn-primary" onClick={handleResetPw}
              disabled={newPw.length < 6} style={{ fontSize: '0.8rem' }}>
              Reset
            </button>
            <button className="btn btn-secondary" onClick={() => { setResetPwUserId(null); setNewPw(''); }}
              style={{ fontSize: '0.8rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '0.75rem 1.5rem 1.5rem', overflowX: 'auto' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>
            Loading…
          </p>
        ) : tab === 'users' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Full Name', 'Username', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '0.5rem 0.75rem', textAlign: 'left',
                    fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: u.username === user?.username ? 'var(--brand-light)' : undefined,
                }}>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 500 }}>
                    {u.fullName}
                    {u.username === user?.username && (
                      <span style={{
                        marginLeft: 6, fontSize: '0.68rem', background: '#e0f2fe',
                        color: '#0369a1', borderRadius: 4, padding: '0 6px',
                      }}>You</span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>
                    {u.username}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span style={{
                      ...ROLE_COLORS[u.role],
                      padding: '0.2rem 0.6rem', borderRadius: 9999,
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: 9999,
                      fontSize: '0.7rem', fontWeight: 600,
                      background: u.enabled ? '#f0fdf4' : '#f1f5f9',
                      color: u.enabled ? '#16a34a' : '#94a3b8',
                    }}>
                      {u.enabled ? '● Active' : '○ Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>
                    {formatDt(u.lastLogin)}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className={`btn ${u.enabled ? 'btn-secondary' : 'btn-ghost-green'}`}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}
                        onClick={() => handleToggle(u)}
                        disabled={u.username === user?.username}>
                        {u.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}
                        onClick={() => { setResetPwUserId(u.id); setNewPw(''); }}>
                        🔑 Reset PW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* Audit Log */
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Time', 'Actor', 'Action', 'Details', 'IP'].map(h => (
                  <th key={h} style={{
                    padding: '0.5rem 0.75rem', textAlign: 'left',
                    fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDt(log.performedAt)}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{log.actor}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      background: 'var(--brand-light)', color: 'var(--brand)',
                      padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit log entries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
