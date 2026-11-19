import React, { useEffect, useState, useCallback } from 'react';
import { PatientLayout } from './PatientDashboard';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { usePatientWebSocket } from '../hooks/usePatientWebSocket';
import { API_BASE, patientFetch } from '../services/api';

interface Notification { id: string; type: string; message: string; time: Date; read: boolean; }

const typeIcon: Record<string, string> = {
  APPOINTMENT_CONFIRMED: '✅', QUEUE_UPDATE: '🔢', REMINDER: '🔔',
  PAYMENT_SUCCESS: '💳', PRESCRIPTION_ADDED: '💊',
};

export const PatientNotifications: React.FC = () => {
  const { patient } = usePatientAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<any>(null);
  const [liveQueueStatus, setLiveQueueStatus] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchLiveQueue = useCallback((doctorId: number | string, scheduledAt?: string) => {
    if (!doctorId) return;
    const dateStr = scheduledAt ? scheduledAt.split('T')[0] : '';
    fetch(`${API_BASE}/discovery/doctors/${doctorId}/queue?date=${dateStr}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setLiveQueueStatus(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!patient) return;

    const storageKey = `mediflowiq_patient_${patient.patientId}_notifications`;
    const cached = localStorage.getItem(storageKey);
    let initialList: Notification[] = [];
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          initialList = parsed.map((item: any) => ({
            ...item,
            time: new Date(item.time),
          }));
        }
      } catch { /* ignore parse error */ }
    }

    patientFetch(`${API_BASE}/patient/${patient.patientId}/appointments`)
      .then(async r => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((appts: any) => {
        if (Array.isArray(appts)) {
          const confirmed = appts.find(a => a.status === 'CONFIRMED');
          if (confirmed) {
            setQueue({
              doctorId: confirmed.doctor?.id,
              doctorName: confirmed.doctor?.name,
              hospitalName: confirmed.hospital?.name,
              position: confirmed.queuePosition != null ? confirmed.queuePosition : 1,
              scheduledAt: confirmed.scheduledAt,
            });
            fetchLiveQueue(confirmed.doctor?.id, confirmed.scheduledAt);
          }

          // Build notification history from real appointment events
          const derivedNotifs: Notification[] = [];
          appts.forEach((a: any) => {
            const docName = a.doctor?.name
              ? (a.doctor.name.startsWith('Dr.') ? a.doctor.name : `Dr. ${a.doctor.name}`)
              : 'Doctor';
            const dateStr = a.scheduledAt
              ? new Date(a.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : '';

            if (a.status === 'CONFIRMED') {
              derivedNotifs.push({
                id: `appt-confirmed-${a.id}`,
                type: 'APPOINTMENT_CONFIRMED',
                message: `Appointment confirmed with ${docName} for ${dateStr}. Queue Token #${a.queuePosition ?? 1}.`,
                time: new Date(a.createdAt || a.scheduledAt || Date.now()),
                read: false,
              });
              if (a.amountPaise) {
                derivedNotifs.push({
                  id: `pay-${a.id}`,
                  type: 'PAYMENT_SUCCESS',
                  message: `Payment of ₹${Math.round(a.amountPaise / 100)} verified for consultation with ${docName}.`,
                  time: new Date(a.createdAt || a.scheduledAt || Date.now()),
                  read: true,
                });
              }
            } else if (a.status === 'COMPLETED') {
              derivedNotifs.push({
                id: `appt-completed-${a.id}`,
                type: 'REMINDER',
                message: `Consultation with ${docName} completed. Clinical notes and prescriptions are available.`,
                time: new Date(a.scheduledAt || Date.now()),
                read: true,
              });
            }
          });

          // Merge live WebSocket cached notifications with appointment events
          const allIds = new Set(initialList.map(n => n.id));
          const merged = [...initialList];
          derivedNotifs.forEach(dn => {
            if (!allIds.has(dn.id)) {
              merged.push(dn);
              allIds.add(dn.id);
            }
          });

          merged.sort((a, b) => b.time.getTime() - a.time.getTime());
          setNotifications(merged);
          return;
        }
        setNotifications(initialList);
      })
      .catch(err => {
        console.error('Failed to load patient notifications appointments:', err);
        setNotifications(initialList);
      });
  }, [patient, fetchLiveQueue]);

  const handleWsMessage = useCallback((payload: any) => {
    setWsConnected(true);
    const n: Notification = { id: Date.now().toString(), type: payload.type, message: payload.message, time: new Date(), read: false };
    setNotifications(prev => {
      const updated = [n, ...prev];
      if (patient) {
        localStorage.setItem(`mediflowiq_patient_${patient.patientId}_notifications`, JSON.stringify(updated.slice(0, 30)));
      }
      return updated;
    });
    setToast(payload.message);
    setTimeout(() => setToast(null), 4000);

    if (payload.type === 'QUEUE_UPDATE') {
      setLiveQueueStatus((prev: any) => ({
        ...prev,
        currentlyServingToken: payload.currentlyServing ?? prev?.currentlyServingToken,
        patientsAhead: payload.patientsAhead,
      }));
    } else if (payload.type === 'APPOINTMENT_COMPLETED' || payload.type === 'APPOINTMENT_CONFIRMED') {
      if (queue?.doctorId) {
        fetchLiveQueue(queue.doctorId, queue.scheduledAt);
      }
    }
  }, [patient, queue, fetchLiveQueue]);

  usePatientWebSocket(patient?.patientId ?? null, handleWsMessage);

  const dismiss = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (patient) {
        localStorage.setItem(`mediflowiq_patient_${patient.patientId}_notifications`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    if (patient) {
      localStorage.removeItem(`mediflowiq_patient_${patient.patientId}_notifications`);
    }
  };

  // Determine queue progression status
  const myToken = queue?.position ?? 1;
  const currentlyServing = liveQueueStatus?.currentlyServingToken;
  const completedTokens: number[] = liveQueueStatus?.completedTokens ?? [];

  // Calculate remaining patients ahead of this patient
  const remainingAhead = Math.max(
    0,
    myToken - 1 - completedTokens.filter((t: number) => t < myToken).length
  );
  const isMyTurn = (currentlyServing != null && currentlyServing === myToken) || remainingAhead === 0;
  const isNextInLine = !isMyTurn && remainingAhead === 1;

  const maxTokenToDisplay = Math.max(myToken + 1, (currentlyServing ?? 1) + 2, 4);
  const trackTokens = Array.from({ length: Math.min(maxTokenToDisplay, 6) }, (_, i) => i + 1);

  return (
    <PatientLayout active="/patient/notifications" title="🔔 Notifications">
      {/* Live Ongoing Queue Status Card */}
      {queue && (
        <div style={{ background: 'linear-gradient(135deg, #0284C7, #0369A1)', borderRadius: 16, padding: '1.75rem', color: 'white', marginBottom: '2rem', boxShadow: '0 8px 30px rgba(2,132,199,0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.6rem', borderRadius: 99 }}>
                  🎫 Your Token Number
                </span>
                {isMyTurn ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#4ADE80', color: '#064E3B', padding: '0.2rem 0.6rem', borderRadius: 99 }}>
                    🎉 YOU ARE NEXT IN LINE (IT'S YOUR TURN)
                  </span>
                ) : isNextInLine ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#FDE047', color: '#713F12', padding: '0.2rem 0.6rem', borderRadius: 99 }}>
                    👉 NEXT IN LINE · 1 PATIENT AHEAD
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.22)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: 99 }}>
                    ⏳ {remainingAhead} PATIENTS LEFT TILL YOUR NUMBER
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>#{myToken}</div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.25)', paddingLeft: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {queue.doctorName?.startsWith('Dr.') ? queue.doctorName : `Dr. ${queue.doctorName}`}
                  </div>
                  {queue.hospitalName && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{queue.hospitalName}</div>
                  )}
                </div>
              </div>

              {/* Dynamic Queue Status Message */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
                  {isMyTurn ? (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#DCFCE7', background: 'rgba(16,185,129,0.3)', border: '1px solid #4ADE80', padding: '0.45rem 0.85rem', borderRadius: 8 }}>
                      🎉 You are next in line! Dr. {queue.doctorName?.replace(/^Dr\.\s*/, '')} is ready for your consultation (Token #{myToken}).
                    </div>
                  ) : isNextInLine ? (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FEF3C7', background: 'rgba(251,191,36,0.25)', border: '1px solid #FCD34D', padding: '0.45rem 0.85rem', borderRadius: 8 }}>
                      👉 You are next in line! Only 1 patient left till your number (~15 mins wait).
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', padding: '0.45rem 0.85rem', borderRadius: 8 }}>
                      ⏳ <strong>{remainingAhead} patients left</strong> till your number (Est. wait: ~{remainingAhead * 15} mins).
                    </div>
                  )}

                  {currentlyServing && !isMyTurn && (
                    <span style={{ background: '#FBBF24', color: '#78350F', fontWeight: 800, fontSize: '0.8rem', padding: '0.35rem 0.65rem', borderRadius: 8 }}>
                      🩺 Now Calling: Token #{currentlyServing}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.2rem' }}>
                  📅 Scheduled for {new Date(queue.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {queue.scheduledAt && ` at ${new Date(queue.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
            </div>

            {/* Visual Queue Tracker */}
            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: wsConnected ? '#4ADE80' : '#FCD34D', animation: wsConnected ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{wsConnected ? 'Live Queue Connected' : 'Connecting to live queue…'}</span>
              </div>

              {/* Step Dots with Token labels */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem 0.8rem', borderRadius: 12, display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                {trackTokens.map(t => {
                  const isDone = completedTokens.includes(t);
                  const isNowServing = currentlyServing === t;
                  const isYou = t === myToken;

                  let bg = 'rgba(255,255,255,0.15)';
                  let color = 'white';
                  let border = 'none';

                  if (isYou) {
                    bg = 'white';
                    color = '#0369A1';
                  } else if (isNowServing) {
                    bg = '#FBBF24';
                    color = '#78350F';
                    border = '2px solid #FEF3C7';
                  } else if (isDone) {
                    bg = 'rgba(255,255,255,0.3)';
                    color = '#D1FAE5';
                  }

                  return (
                    <div
                      key={t}
                      style={{
                        minWidth: 32, height: 32, borderRadius: 8,
                        background: bg, color, border,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 800,
                        padding: '0 4px',
                        boxShadow: isYou ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                      }}
                      title={isYou ? 'Your token' : isNowServing ? 'Currently attending' : isDone ? 'Attended' : `Token #${t}`}
                    >
                      <span>{isYou ? 'YOU' : isDone ? '✓' : `#${t}`}</span>
                      {isNowServing && !isYou && <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>NOW</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: '0.35rem' }}>
                Queue Progress Tracker
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Feed */}
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Recent Notifications</h2>
          {notifications.length > 0 && <button onClick={clearAll} style={{ fontSize: '0.8rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>}
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
