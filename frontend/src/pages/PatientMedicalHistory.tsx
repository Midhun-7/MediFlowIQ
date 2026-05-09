import React, { useEffect, useState } from 'react';
import { PatientLayout, EmptyState, LoadingSpinner } from './PatientDashboard';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { API_BASE } from '../services/api';

const VISIT_COLORS: Record<string, string> = {
  CONSULTATION: '#0EA5E9', SURGERY: '#EF4444',
  LAB_RESULT: '#10B981', FOLLOW_UP: '#F59E0B', EMERGENCY: '#DC2626',
};

export const PatientMedicalHistory: React.FC = () => {
  const { patient } = usePatientAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient) return;
    fetch(`${API_BASE}/patient/${patient.patientId}/medical-history`)
      .then(r => r.json()).then(setRecords).finally(() => setLoading(false));
  }, [patient]);

  return (
    <PatientLayout active="/patient/history" title="📋 Medical History">
      <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
        Your complete medical timeline — all visits, diagnoses, and lab results in one place.
      </p>
      {loading ? <LoadingSpinner /> : records.length === 0 ? <EmptyState msg="No medical records found" /> :
        records.map((r: any) => {
          const color = VISIT_COLORS[r.visitType] ?? '#64748B';
          return (
            <div key={r.id} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: color + '15', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, zIndex: 1 }}>
                  {r.visitType === 'SURGERY' ? '🔬' : r.visitType === 'LAB_RESULT' ? '🧪' : r.visitType === 'EMERGENCY' ? '🚨' : r.visitType === 'FOLLOW_UP' ? '🔁' : '🩺'}
                </div>
                <div style={{ width: 2, flex: 1, background: '#E2E8F0', minHeight: 20 }} />
              </div>
              {/* Card */}
              <div style={{ flex: 1, background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ background: color + '15', color, borderRadius: 99, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {r.visitType?.replace('_', ' ')}
                    </span>
                    <h3 style={{ fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{r.diagnosis || 'Visit'}</h3>
                    <div style={{ color: '#64748B', fontSize: '0.8rem' }}>
                      {r.doctor && <>👨‍⚕️ Dr. {r.doctor.name}</>}
                      {r.doctor?.specialty && <> · {r.doctor.specialty}</>}
                    </div>
                    {r.hospital && <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.15rem' }}>🏥 {r.hospital.name}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>{new Date(r.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{new Date(r.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                {r.notes && <div style={{ marginTop: '0.75rem', background: '#F8FAFC', borderRadius: 10, padding: '0.75rem', fontSize: '0.85rem', color: '#374151', borderLeft: `3px solid ${color}` }}>{r.notes}</div>}
              </div>
            </div>
          );
        })
      }
    </PatientLayout>
  );
};
