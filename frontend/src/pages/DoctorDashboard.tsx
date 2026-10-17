import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';

// ── Doctor Sidebar ──────────────────────────────────────────────────────────

const DOCTOR_NAV = [
  { icon: '📅', label: "Today's Schedule",  path: '/doctor/dashboard' },
  { icon: '🗓️', label: 'All & Upcoming',    path: '/doctor/dashboard?view=all' },
  { icon: '💊', label: 'Write Prescription', path: '/doctor/prescriptions' },
];

const DoctorSidebar: React.FC<{ active?: string }> = ({ active }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getAccessToken = () => {
    const raw = localStorage.getItem('mediflowiq_auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.accessToken) return parsed.accessToken;
      } catch { /* ignore */ }
    }
    return localStorage.getItem('token') ?? '';
  };
  const token = getAccessToken();

  // Resolve display name from JWT payload
  const doctorName = (() => {
    try {
      const raw = localStorage.getItem('mediflowiq_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fullName) return parsed.fullName;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.fullName ?? payload.name ?? payload.sub ?? 'Doctor';
    } catch { return 'Doctor'; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mediflowiq_auth');
    navigate('/login');
  };

  return (
    <aside style={sidebarSt.sidebar}>
      <div style={sidebarSt.brand}>
        <div style={sidebarSt.brandIcon}>🏥</div>
        <div>
          <div style={sidebarSt.brandName}>MediFlow<span style={{ color: '#0EA5E9' }}>IQ</span></div>
          <div style={sidebarSt.brandRole}>Doctor Portal</div>
        </div>
      </div>

      <nav style={sidebarSt.nav}>
        {DOCTOR_NAV.map(item => {
          const isViewAll = item.path === '/doctor/dashboard?view=all';
          const isActive = active
            ? active === item.path
            : isViewAll
              ? location.pathname === '/doctor/dashboard' && location.search.includes('view=all')
              : item.path === '/doctor/dashboard'
                ? location.pathname === '/doctor/dashboard' && !location.search.includes('view=all')
                : location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path} style={{ ...sidebarSt.navItem, ...(isActive ? sidebarSt.navItemActive : {}) }}>
              <span style={sidebarSt.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={sidebarSt.footer}>
        <div style={sidebarSt.doctorInfo}>
          <div style={sidebarSt.avatar}>{doctorName.charAt(0).toUpperCase()}</div>
          <div>
            <div style={sidebarSt.doctorName}>{doctorName}</div>
            <div style={sidebarSt.doctorRole}>Doctor</div>
          </div>
        </div>
        <button onClick={handleLogout} style={sidebarSt.logoutBtn}>🚪 Sign Out</button>
      </div>
    </aside>
  );
};

const sidebarSt: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px', minHeight: '100vh', background: '#0F172A',
    display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
    position: 'fixed', left: 0, top: 0, bottom: 0,
    boxShadow: '4px 0 20px rgba(0,0,0,0.15)', zIndex: 100,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0 1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '0.75rem',
  },
  brandIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
  },
  brandName: { fontSize: '1.1rem', fontWeight: 700, color: 'white' },
  brandRole: { fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.7rem 0.75rem', borderRadius: '10px',
    color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
  },
  navItemActive: {
    background: 'rgba(99,102,241,0.15)', color: '#818CF8',
    borderLeft: '3px solid #818CF8',
  },
  navIcon: { fontSize: '1.1rem', width: '20px', textAlign: 'center' },
  footer: {
    padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'auto',
  },
  doctorInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 700, fontSize: '0.9rem',
  },
  doctorName: { fontSize: '0.8rem', fontWeight: 600, color: 'white' },
  doctorRole: { fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' },
  logoutBtn: {
    width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#F87171', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem',
    cursor: 'pointer', fontFamily: 'inherit',
  },
};

// ── Status badge ─────────────────────────────────────────────────────────────

const statusBadgeColors: Record<string, [string, string]> = {
  CONFIRMED:       ['#D1FAE5', '#059669'],
  PENDING_PAYMENT: ['#FEF3C7', '#D97706'],
  COMPLETED:       ['#EFF6FF', '#2563EB'],
  CANCELLED:       ['#FEE2E2', '#DC2626'],
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const [bg, text] = statusBadgeColors[status] ?? ['#F1F5F9', '#64748B'];
  return (
    <span style={{ background: bg, color: text, borderRadius: 99, padding: '0.3rem 0.85rem', fontSize: '0.78rem', fontWeight: 700 }}>
      {status.replace('_', ' ')}
    </span>
  );
};

// ── Date Formatter Helper ────────────────────────────────────────────────────

const formatAppointmentDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${timeStr}`;
};

// ── Doctor Dashboard ─────────────────────────────────────────────────────────

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [filterMode, setFilterMode] = useState<'today' | 'all'>(viewParam === 'all' ? 'all' : 'today');

  const getAccessToken = () => {
    const raw = localStorage.getItem('mediflowiq_auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.accessToken) return parsed.accessToken;
      } catch { /* ignore */ }
    }
    return localStorage.getItem('token') ?? '';
  };
  const token = getAccessToken();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState<number | null>(null);

  // Sync state with URL view parameter
  useEffect(() => {
    setFilterMode(viewParam === 'all' ? 'all' : 'today');
  }, [viewParam]);

  const handleTabChange = (mode: 'today' | 'all') => {
    setFilterMode(mode);
    if (mode === 'all') {
      setSearchParams({ view: 'all' });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/discovery/hospitals`).catch(() => {});
    fetch(`${API_BASE}/discovery/doctors`)
      .then(r => r.json())
      .then(docs => setDoctors(Array.isArray(docs) ? docs : []))
      .catch(() => {});
  }, []);

  const fetchAppointments = useCallback(() => {
    setError('');
    const params = new URLSearchParams();
    if (selectedDoctorId === 'all') {
      params.append('allDoctors', 'true');
    } else if (selectedDoctorId) {
      params.append('doctorId', selectedDoctorId);
    }

    if (filterMode === 'today') {
      params.append('today', 'true');
    } else {
      params.append('today', 'false');
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    fetch(`${API_BASE}/appointments${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) {
          const msg = await r.text();
          throw new Error(msg || `Error ${r.status}`);
        }
        return r.json();
      })
      .then(setAppointments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, selectedDoctorId, filterMode]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleComplete = async (apptId: number) => {
    setCompleting(apptId);
    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark as attended');
      // Refresh list
      fetchAppointments();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCompleting(null);
    }
  };

  const handleWritePrescription = (appt: any) => {
    const patientId = appt.patientAccountId ?? appt.patientAccount?.id ?? '';
    const hospitalId = appt.hospital?.id ?? '';
    navigate(`/doctor/prescriptions?patientId=${patientId}&hospitalId=${hospitalId}&appointmentId=${appt.id}`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FF', fontFamily: "'Inter', sans-serif" }}>
      <DoctorSidebar active={filterMode === 'all' ? '/doctor/dashboard?view=all' : '/doctor/dashboard'} />

      <main style={{ marginLeft: '240px', flex: 1, padding: '2rem', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {filterMode === 'today' ? "📅 Today's Appointments" : "🗓️ All & Upcoming Appointments"}
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', background: '#E2E8F0', padding: '3px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => handleTabChange('today')}
                style={{
                  background: filterMode === 'today' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: filterMode === 'today' ? 700 : 500,
                  color: filterMode === 'today' ? '#0F172A' : '#64748B',
                  boxShadow: filterMode === 'today' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                📅 Today
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                style={{
                  background: filterMode === 'all' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: filterMode === 'all' ? 700 : 500,
                  color: filterMode === 'all' ? '#0F172A' : '#64748B',
                  boxShadow: filterMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🗓️ All & Upcoming
              </button>
            </div>

            {/* Doctor Filter Dropdown */}
            {doctors.length > 0 && (
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: 10,
                  border: '1.5px solid #E2E8F0',
                  background: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">👤 My Appointments</option>
                <option value="all">🏥 All Doctors (Clinic Overview)</option>
                {doctors.map(d => {
                  const docDisplayName = d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`;
                  return (
                    <option key={d.id} value={d.id}>
                      {docDisplayName} ({d.specialty})
                    </option>
                  );
                })}
              </select>
            )}
            <button onClick={fetchAppointments} style={btnSt.refresh}>🔄 Refresh</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: 10, color: '#BE123C', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1E293B', marginBottom: '0.35rem' }}>
              {filterMode === 'today' ? "No appointments scheduled for today" : "No appointments found"}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              {filterMode === 'today'
                ? "There are no consultations scheduled for today under this filter. Switch to \"All & Upcoming\" to view bookings for tomorrow and beyond."
                : "No matching appointment bookings were found for the selected filter."}
            </p>
            {filterMode === 'today' && (
              <button
                onClick={() => handleTabChange('all')}
                style={{
                  background: '#6366F1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                🗓️ View All & Upcoming Appointments
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointments.map((appt: any) => {
              const patientName = appt.patientName || appt.patientAccount?.fullName || appt.patientAccount?.name || (appt.patientAccountId ? `Patient #${appt.patientAccountId}` : 'Patient');
              const patientEmail = appt.patientEmail || appt.patientAccount?.email || '';
              const patientPhone = appt.patientPhone || appt.patientAccount?.phone || '';
              const avatarInitial = patientName.replace(/^Patient\s*#?/, '').trim().charAt(0).toUpperCase() || 'P';

              return (
                <div key={appt.id} style={cardSt.card}>
                  {/* Left: patient + time info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={cardSt.avatar}>
                        {avatarInitial}
                      </div>
                      <div>
                        <div style={cardSt.patientName}>{patientName}</div>
                        <div style={cardSt.patientEmail}>
                          {patientEmail || (patientPhone ? `📞 ${patientPhone}` : (appt.patientAccountId ? `Patient ID #${appt.patientAccountId}` : ''))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.6rem' }}>
                      <div style={{ ...cardSt.meta, fontWeight: 600, color: '#1E293B', background: '#EEF2FF', border: '1px solid #E0E7FF' }}>
                        🕐 {formatAppointmentDate(appt.scheduledAt)}
                      </div>
                      <div style={cardSt.meta}>
                        {appt.appointmentType === 'TELEMEDICINE' ? '📹 Telemedicine' : '🏥 In-Person'}
                      </div>
                      {appt.doctor?.name && (
                        <div style={cardSt.meta}>
                          👨‍⚕️ {appt.doctor.name.startsWith('Dr.') ? appt.doctor.name : `Dr. ${appt.doctor.name}`} ({appt.doctor.specialty ?? 'General'})
                        </div>
                      )}
                      {appt.hospital?.name && (
                        <div style={cardSt.meta}>🏥 {appt.hospital.name}</div>
                      )}
                    </div>
                  </div>

                {/* Right: status + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                  <StatusBadge status={appt.status} />

                  {appt.status === 'CONFIRMED' && (
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleWritePrescription(appt)}
                        style={{
                          background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.6rem 1.25rem',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
                        }}
                      >
                        🩺 Attend Patient
                      </button>
                      <button
                        disabled={completing === appt.id}
                        onClick={() => handleComplete(appt.id)}
                        title="Mark attended without prescribing medicines"
                        style={{
                          background: 'none',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem',
                          color: '#64748B',
                          cursor: 'pointer',
                        }}
                      >
                        {completing === appt.id ? 'Marking…' : 'Quick Complete (No Rx)'}
                      </button>
                    </div>
                  )}

                  {appt.status === 'COMPLETED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669', background: '#D1FAE5', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                        ✓ Attended
                      </span>
                      <button
                        onClick={() => handleWritePrescription(appt)}
                        style={{
                          background: 'white',
                          border: '1px solid #CBD5E1',
                          color: '#475569',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        + Add Rx
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const cardSt: Record<string, React.CSSProperties> = {
  card: {
    background: 'white', borderRadius: '16px', padding: '1.5rem',
    border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '1rem',
  },
  avatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
  },
  patientName: { fontWeight: 700, color: '#0F172A', fontSize: '1rem' },
  patientEmail: { fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' },
  meta: { fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', padding: '0.3rem 0.65rem' },
};

const btnSt: Record<string, React.CSSProperties> = {
  refresh: {
    background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '10px',
    padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', color: '#374151',
  },
  complete: {
    background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white',
    border: 'none', borderRadius: '10px', padding: '0.5rem 1rem',
    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  prescribe: {
    background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white',
    border: 'none', borderRadius: '10px', padding: '0.5rem 1rem',
    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  prescribeOutline: {
    background: 'white', border: '1.5px solid #6366F1', borderRadius: '10px',
    padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', color: '#6366F1',
  },
};
