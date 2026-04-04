import { useEffect, useState, useCallback } from 'react';
import type { QueueEntry, QueueStats } from './types';
import { getQueue, getStats } from './services/api';
import { connectWebSocket, disconnectWebSocket } from './services/socket';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import QueueBoard from './components/QueueBoard';
import StatCard from './components/StatCard';

export default function App() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<QueueStats>({ totalWaiting: 0, emergencies: 0, avgWaitMinutes: 0 });
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([getQueue(), getStats()]);
      setQueue(q);
      setStats(s);
      setLastUpdated(new Date());
    } catch {
      // Backend might not be running yet
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    // Connect WebSocket for live updates
    const client = connectWebSocket((updatedQueue) => {
      setQueue(updatedQueue);
      setLastUpdated(new Date());
      // Refresh stats too
      getStats().then(setStats).catch(() => {});
    });

    client.onConnect = () => setWsConnected(true);
    client.onDisconnect = () => setWsConnected(false);
    client.onWebSocketClose = () => setWsConnected(false);

    return () => {
      disconnectWebSocket();
    };
  }, [fetchQueue]);

  const formatTime = (d: Date | null) =>
    d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)' }}>
      {/* ── Header ── */}
      <header className="border-b border-white/5 sticky top-0 z-50"
        style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              🏥
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text tracking-tight">MediFlowIQ</h1>
              <p className="text-xs text-slate-500 leading-none">Hospital Queue Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {lastUpdated && (
              <span>Last updated: <span className="text-slate-400">{formatTime(lastUpdated)}</span></span>
            )}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              wsConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400 blink' : 'bg-red-400'}`} />
              {wsConnected ? 'WebSocket Live' : 'Connecting...'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Waiting"
            value={stats.totalWaiting}
            icon="👥"
            subtitle="Patients in active queue"
            accentColor="#0ea5e9"
          />
          <StatCard
            title="Emergencies"
            value={stats.emergencies}
            icon="🚨"
            subtitle="Critical priority patients"
            accentColor="#ef4444"
          />
          <StatCard
            title="Avg. Wait Time"
            value={`${stats.avgWaitMinutes} min`}
            icon="⏱️"
            subtitle="Estimated per patient"
            accentColor="#a855f7"
          />
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Registration Panel */}
          <div className="w-full lg:w-80 shrink-0">
            <PatientRegistrationForm onRegistered={fetchQueue} />
          </div>

          {/* Queue Board */}
          <div className="flex-1 min-w-0">
            <QueueBoard
              entries={queue}
              onUpdate={fetchQueue}
              connected={wsConnected}
            />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-slate-600 border-t border-white/5 mt-8">
        MediFlowIQ · Phase 1 — Core Queue System · Built with ☕ Java + ⚛️ React
      </footer>
    </div>
  );
}
