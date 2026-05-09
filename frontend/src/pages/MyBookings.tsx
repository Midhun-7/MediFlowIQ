import React, { useEffect, useState } from 'react';
import { PatientLayout, LoadingSpinner, EmptyState } from './PatientDashboard';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { API_BASE } from '../services/api';

const statusColors: Record<string, [string, string]> = {
  CONFIRMED:       ['#D1FAE5', '#059669'],
  PENDING_PAYMENT: ['#FEF3C7', '#D97706'],
  COMPLETED:       ['#F0F9FF', '#0284C7'],
  CANCELLED:       ['#FEE2E2', '#DC2626'],
};

export const MyBookings: React.FC = () => {
  const { patient } = usePatientAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient) return;
    fetch(`${API_BASE}/patient/${patient.patientId}/appointments`)
      .then(r => r.json()).then(setAppointments).finally(() => setLoading(false));
  }, [patient]);

  return (
    <PatientLayout active="/patient/bookings" title="📅 My Bookings">
      {loading ? <LoadingSpinner /> : appointments.length === 0 ? <EmptyState msg="No appointments found. Book one from Find Doctor." /> :
        appointments.map((a: any) => {
          const [bg, text] = statusColors[a.status] ?? ['#F1F5F9', '#64748B'];
          return (
            <div key={a.id} style={{ background: 'white', borderRadius: 14, padding: '1.5rem', marginBottom: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem', marginBottom: '0.25rem' }}>Dr. {a.doctor?.name}</div>
                <div style={{ color: '#0EA5E9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{a.doctor?.specialty}</div>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>🏥 {a.hospital?.name}</div>
                <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  📅 {new Date(a.scheduledAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
                {a.amountPaise && <div style={{ color: '#374151', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600 }}>💰 ₹{Math.round(a.amountPaise / 100)}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{ background: bg, color: text, borderRadius: 99, padding: '0.3rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}>{a.status.replace('_', ' ')}</span>
                {a.queuePosition && a.status === 'CONFIRMED' && (
                  <span style={{ background: '#EFF6FF', color: '#0284C7', borderRadius: 99, padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>Queue #{a.queuePosition}</span>
                )}
              </div>
            </div>
          );
        })
      }
    </PatientLayout>
  );
};
