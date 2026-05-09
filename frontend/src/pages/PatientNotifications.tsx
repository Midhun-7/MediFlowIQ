import React, { useEffect, useState, useCallback } from 'react';
import { PatientLayout } from './PatientDashboard';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { usePatientWebSocket } from '../hooks/usePatientWebSocket';
import { API_BASE } from '../services/api';

interface Notification { id: string; type: string; message: string; time: Date; read: boolean; }

const typeIcon: Record<string, string> = {
  APPOINTMENT_CONFIRMED: '✅', QUEUE_UPDATE: '🔢', REMINDER: '🔔',
  PAYMENT_SUCCESS: '💳', PRESCRIPTION_ADDED: '💊',
};

export const PatientNotifications: React.FC = () => {
  const { patient } = usePatientAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!patient) return;
    fetch(`${API_BASE}/patient/${patient.patientId}/appointments`)
      .then(r => r.json())
      .then((appts: any[]) => {
        const confirmed = appts.find(a => a.status === 'CONFIRMED');
        if (confirmed) setQueue({ doctorName: confirmed.doctor?.name, position: confirmed.queuePosition ?? 3, scheduledAt: confirmed.scheduledAt });
      });
  }, [patient]);

  const handleWsMessage = useCallback((payload: any) => {
    setWsConnected(true);
    const n: Notification = { id: Date.now().toString(), type: payload.type, message: payload.message, time: new Date(), read: false };
    setNotifications(prev => [n, ...prev]);
    setToast(payload.message);
    setTimeout(() => setToast(null), 4000);
    if (payload.type === 'QUEUE_UPDATE') {
      setQueue((prev: any) => prev ? { ...prev, position: Math.max(1, (prev.position ?? 3) - 1) } : prev);
    }
  }, []);

  usePatientWebSocket(patient?.patientId ?? null, handleWsMessage);

  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <PatientLayout active="/patient/notifications" title="🔔 Notifications">
      {/* Live Queue Card */}
      {queue && (
        <div style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', borderRadius: 16, padding: '1.5rem', color: 'white', marginBottom: '2rem', boxShadow: '0 8px 30px rgba(14,165,233,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>My Queue Position</div>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>#{queue.position}</div>
              <div style={{ marginTop: '0.5rem', opacity: 0.9 }}>Dr. {queue.doctorName}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>Est. wait: ~{(queue.position - 1) * 15} minutes</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: wsConnected ? '#4ADE80' : '#FCD34D', animation: wsConnected ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{wsConnected ? 'Live Updates On' : 'Connecting…'}</span>
              </div>
              {/* Queue visual */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                {[...Array(Math.min(queue.position + 2, 7))].map((_, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: i < queue.position - 1 ? 'rgba(255,255,255,0.3)' : i === queue.position - 1 ? 'white' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: i === queue.position - 1 ? '#0284C7' : 'white', fontWeight: i === queue.position - 1 ? 800 : 400 }}>
                    {i === queue.position - 1 ? 'YOU' : i < queue.position - 1 ? '✓' : (i + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Feed */}
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Recent Notifications</h2>
          {notifications.length > 0 && <button onClick={() => setNotifications([])} style={{ fontSize: '0.8rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>}
        </div>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <p>No notifications yet. Real-time alerts will appear here.</p>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', borderRadius: 12, marginBottom: '0.5rem', background: n.read ? '#FAFAFA' : '#F0F9FF', border: `1px solid ${n.read ? '#F1F5F9' : '#BAE6FD'}`, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
              {typeIcon[n.type] ?? '🔔'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{n.message}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>{n.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem', padding: '0.25rem', flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#0EA5E9', color: 'white', borderRadius: 12, padding: '0.875rem 1.25rem', boxShadow: '0 8px 30px rgba(14,165,233,0.4)', zIndex: 9999, maxWidth: 320, fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, animation: 'slideInRight 0.3s ease' }}>
          🔔 {toast}
        </div>
      )}
    </PatientLayout>
  );
};
