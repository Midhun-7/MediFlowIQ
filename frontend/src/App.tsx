import { useEffect, useState, useCallback } from 'react';
import type { QueueEntry, QueueStats, UserRole } from './types';
import { getQueue, getStats } from './services/api';
import { connectWebSocket, disconnectWebSocket } from './services/socket';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import QueueBoard from './components/QueueBoard';
import StatCard from './components/StatCard';
import AmbulanceMap from './components/AmbulanceMap';
import SystemLoadIndicator from './components/SystemLoadIndicator';

type Tab = 'queue' | 'ambulance' | 'admin';

const ROLE_BADGE: Record<UserRole, { label: string; bg: string; color: string }> = {
  ADMIN:  { label: 'Admin',  bg: '#fef2f2', color: '#dc2626' },
  DOCTOR: { label: 'Doctor', bg: '#eff6ff', color: '#1d4ed8' },
  STAFF:  { label: 'Staff',  bg: '#f0fdf4', color: '#16a34a' },
};

// ── Inner dashboard (rendered only when authenticated) ─────────────────────

function Dashboard() {
  const { user, logout, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [queue, setQueue]   = useState<QueueEntry[]>([]);
  const [stats, setStats]   = useState<QueueStats>({
    totalWaiting: 0, emergencies: 0, avgWaitMinutes: 0, load: 'LOW',
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([getQueue(), getStats()]);
      setQueue(q);
      setStats(s);
      setLastUpdated(new Date());
    } catch { /* Backend might not be running yet */ }
  }, []);

  useEffect(() => {
    fetchQueue();

    const client = connectWebSocket(
      (updatedQueue) => { setQueue(updatedQueue); setLastUpdated(new Date()); },
      (updatedStats) => { setStats(updatedStats); }
    );

    client.onConnect    = () => setWsConnected(true);
    client.onDisconnect = () => setWsConnected(false);
    client.onWebSocketClose = () => setWsConnected(false);

    return () => { disconnectWebSocket(); };
  }, [fetchQueue]);

  const formatTime = (d: Date | null) =>
    d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  const allTabs: { id: Tab; label: string; icon: string; visible: boolean }[] = [
    { id: 'queue',     label: 'Patient Queue',     icon: '👥', visible: true },
    { id: 'ambulance', label: 'Ambulance Tracker', icon: '🚑', visible: true },
    { id: 'admin',     label: 'Admin Panel',       icon: '⚙️', visible: isAdmin },
  ];
  const tabs = allTabs.filter(t => t.visible);

  const roleBadge = user ? ROLE_BADGE[user.role] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>

      {/* ── Header ── */}
      <header style={{
        backgroundColor: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center justify-between flex-wrap gap-3">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0369a1, #0891b2)' }}>
              <span style={{ filter: 'brightness(0) invert(1)' }}>🏥</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight gradient-text">MediFlowIQ</h1>
              <p className="text-xs leading-none" style={{ color: 'var(--text-muted)' }}>
                Hospital Coordination System
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 flex-wrap">
            {lastUpdated && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Updated: <span style={{ color: 'var(--text-secondary)' }}>{formatTime(lastUpdated)}</span>
              </span>
            )}

            {/* WS indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              wsConnected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500 blink' : 'bg-red-400'}`} />
              {wsConnected ? 'Live' : 'Connecting…'}
            </div>

            {/* Role badge */}
            {roleBadge && (
              <span style={{
                ...roleBadge,
                padding: '0.25rem 0.65rem', borderRadius: 9999,
                fontSize: '0.72rem', fontWeight: 700,
              }}>
                {roleBadge.label}
              </span>
            )}

            {/* User name + logout */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {user?.fullName}
              </span>
              <button
                id="logout-btn"
                onClick={logout}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="max-w-screen-2xl mx-auto px-6" style={{ borderTop: '1px solid var(--border)' }}>
          <nav className="flex gap-0" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all"
                style={{
                  color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-muted)',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* ── Role info banner for STAFF ── */}
        {user?.role === 'STAFF' && (
          <div style={{
            background: 'var(--brand-light)', border: '1px solid #bae6fd',
            borderRadius: 8, padding: '0.6rem 1rem',
            fontSize: '0.8rem', color: '#0369a1',
          }}>
            ℹ️ You are signed in as <strong>Staff</strong>. You can register patients and view the queue.
            Status changes require Doctor or Admin access.
          </div>
        )}

        {/* ── System Load ── */}
        <SystemLoadIndicator load={stats.load} />

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Waiting"  value={stats.totalWaiting}           icon="👥"  subtitle="Patients in active queue"   accentColor="#0369a1" />
          <StatCard title="Emergencies"    value={stats.emergencies}             icon="🚨"  subtitle="Critical priority patients" accentColor="#dc2626" />
          <StatCard title="Avg. Wait Time" value={`${stats.avgWaitMinutes} min`} icon="⏱️" subtitle="Estimated per patient"       accentColor="#7c3aed" />
        </div>

        {/* ── Tab Panels ── */}
        {activeTab === 'queue' && (
          <div className="flex flex-col lg:flex-row gap-5 animate-fade-in">
            <div className="w-full lg:w-80 shrink-0">
              <PatientRegistrationForm onRegistered={fetchQueue} />
            </div>
            <div className="flex-1 min-w-0">
              <QueueBoard entries={queue} onUpdate={fetchQueue} connected={wsConnected} />
            </div>
          </div>
        )}

        {activeTab === 'ambulance' && (
          <div className="animate-fade-in">
            <AmbulanceMap wsConnected={wsConnected} />
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="animate-fade-in">
            <AdminPanel />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-5 text-xs"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        MediFlowIQ · Phase 4 — Security &amp; Roles · Java Spring Boot + React
      </footer>
    </div>
  );
}

// ── Root App — authentication gate ────────────────────────────────────────

export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}
