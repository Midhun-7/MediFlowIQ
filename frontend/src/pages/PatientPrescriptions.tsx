import React, { useEffect, useState } from 'react';
import { PatientLayout, EmptyState, LoadingSpinner } from './PatientDashboard';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { API_BASE } from '../services/api';

const statusColor = (s: string) => ({ ACTIVE: '#10B981', COMPLETED: '#64748B', EXPIRED: '#EF4444' }[s] ?? '#64748B');

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, [string, string]> = { ACTIVE: ['#D1FAE5', '#059669'], COMPLETED: ['#F1F5F9', '#475569'], EXPIRED: ['#FEE2E2', '#DC2626'] };
  const [bg, text] = map[status] ?? ['#F1F5F9', '#64748B'];
  return <span style={{ background: bg, color: text, borderRadius: '99px', padding: '0.3rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}>{status}</span>;
};

export const PatientPrescriptions: React.FC = () => {
  const { patient } = usePatientAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'>('ALL');

  useEffect(() => {
    if (!patient) return;
    fetch(`${API_BASE}/patient/${patient.patientId}/prescriptions`).then(r => r.json()).then(setPrescriptions).finally(() => setLoading(false));
  }, [patient]);

  const filtered = filter === 'ALL' ? prescriptions : prescriptions.filter(p => p.status === filter);
  const counts = prescriptions.reduce((acc: any, p: any) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});

  return (
    <PatientLayout active="/patient/prescriptions" title="💊 My Prescriptions">
      <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
        All prescriptions written by your doctors — no need to carry paper files.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'EXPIRED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.5rem 1.25rem', borderRadius: '99px', border: '1.5px solid',
            borderColor: filter === f ? '#0EA5E9' : '#E2E8F0',
            background: filter === f ? '#EFF6FF' : 'white',
            color: filter === f ? '#0284C7' : '#64748B',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: filter === f ? 700 : 500, fontFamily: 'inherit',
          }}>
            {f}{f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState msg="No prescriptions found" /> :
        filtered.map((rx: any) => (
          <div key={rx.id} style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0', borderLeft: `4px solid ${statusColor(rx.status)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>👨‍⚕️ Dr. {rx.doctor?.name}</div>
                <div style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.2rem' }}>{rx.doctor?.specialty} · {rx.hospital?.name}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  Prescribed: <b>{rx.prescribedDate}</b>{rx.validUntil && <> · Valid until: <b>{rx.validUntil}</b></>}
                </div>
              </div>
              <StatusBadge status={rx.status} />
            </div>
            {rx.medications?.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>{['Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map(h => (
                      <th key={h} style={{ background: '#F8FAFC', color: '#64748B', fontWeight: 600, padding: '0.6rem 0.75rem', textAlign: 'left', borderBottom: '1px solid #E2E8F0', fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rx.medications.map((m: any) => (
                      <tr key={m.id}>
                        <td style={{ padding: '0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9', fontWeight: 600, color: '#0F172A' }}>{m.medicationName}</td>
                        <td style={{ padding: '0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9', color: '#374151' }}>{m.dosage}</td>
                        <td style={{ padding: '0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9', color: '#374151' }}>{m.frequency}</td>
                        <td style={{ padding: '0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9', color: '#374151' }}>{m.durationDays} days</td>
                        <td style={{ padding: '0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9', color: '#374151' }}>{m.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {rx.specialInstructions && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400E' }}>
                ⚠️ <b>Special Instructions:</b> {rx.specialInstructions}
              </div>
            )}
          </div>
        ))
      }
    </PatientLayout>
  );
};
