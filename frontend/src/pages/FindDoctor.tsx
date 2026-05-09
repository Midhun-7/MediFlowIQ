import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientLayout, LoadingSpinner } from './PatientDashboard';
import { API_BASE } from '../services/api';

export const FindDoctor: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [queues, setQueues] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  const fetchDoctors = () => {
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (city) params.set('city', city);
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/discovery/doctors?${params}`).then(r => r.json()),
      fetch(`${API_BASE}/discovery/hospitals`).then(r => r.json()),
    ]).then(([docs, hosps]) => {
      setDoctors(docs);
      setHospitals(hosps);
      docs.forEach((d: any) => {
        fetch(`${API_BASE}/discovery/doctors/${d.id}/queue`).then(r => r.json())
          .then(q => setQueues(prev => ({ ...prev, [d.id]: q })));
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  return (
    <PatientLayout active="/patient/find-doctor" title="🔍 Find a Doctor">
      {/* Search bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Specialty (e.g. Cardiology)"
          style={inp} onFocus={e => (e.target.style.borderColor = '#0EA5E9')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City (e.g. Kochi)"
          style={inp} onFocus={e => (e.target.style.borderColor = '#0EA5E9')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
        <button onClick={fetchDoctors} style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.7rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔍 Search
        </button>
      </div>

      {/* Hospital comparison */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>🏥 Hospitals</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {hospitals.map((h: any) => {
          const pct = Math.round((h.currentLoad / h.maxCapacity) * 100);
          const barColor = pct < 50 ? '#10B981' : pct < 80 ? '#F59E0B' : '#EF4444';
          return (
            <div key={h.id} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{h.name}</div>
              <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.25rem' }}>📍 {h.city}</div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: '0.3rem' }}>
                  <span>Queue Load</span><span style={{ color: barColor, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '99px', transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.3rem' }}>{h.currentLoad}/{h.maxCapacity} patients</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Doctor listing */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>👨‍⚕️ Doctors</h2>
      {loading ? <LoadingSpinner /> :
        doctors.map((d: any) => {
          const q = queues[d.id];
          return (
            <div key={d.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', flexShrink: 0 }}>
                {d.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>Dr. {d.name}</div>
                    <div style={{ color: '#0EA5E9', fontSize: '0.85rem', fontWeight: 600 }}>{d.specialty}</div>
                    <div style={{ color: '#64748B', fontSize: '0.8rem' }}>🏥 {d.hospital?.name}, {d.hospital?.city}</div>
                  </div>
                  <button onClick={() => navigate(`/patient/book/${d.id}`)} style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    📅 Book Appointment
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <Chip icon="⭐" label={`${d.avgRating ?? 'N/A'}/5`} />
                  <Chip icon="🧑‍⚕️" label={`${d.totalPatientsDiagnosed?.toLocaleString()} patients`} />
                  <Chip icon="🎓" label={d.qualifications} />
                  <Chip icon="📅" label={`${d.yearsOfExperience}y exp`} />
                  <Chip icon="💰" label={`₹${d.consultationFee}`} />
                  {d.surgeon && d.surgerySuccessRate && (
                    <Chip icon="🔬" label={`${d.surgerySuccessRate}% surgery success`} color="#059669" />
                  )}
                  {q && (
                    <Chip icon="🕐" label={`Queue: ${q.queueCount} | ~${q.estimatedWaitMin} min wait`} color="#F59E0B" />
                  )}
                </div>
                {d.bio && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.6rem', fontStyle: 'italic' }}>{d.bio}</div>}
              </div>
            </div>
          );
        })
      }
    </PatientLayout>
  );
};

const Chip: React.FC<{ icon: string; label: string; color?: string }> = ({ icon, label, color = '#374151' }) => (
  <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '99px', padding: '0.25rem 0.65rem', fontSize: '0.75rem', color, fontWeight: 500 }}>
    {icon} {label}
  </span>
);

const inp: React.CSSProperties = {
  padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #E2E8F0',
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  flex: 1, minWidth: '200px', color: '#0F172A',
};
