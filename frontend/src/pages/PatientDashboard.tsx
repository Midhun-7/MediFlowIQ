import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { usePatientWebSocket } from '../hooks/usePatientWebSocket';
import { API_BASE } from '../services/api';

// ── Sidebar layout shared across all patient pages ─────────────────────────

const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard',       path: '/patient/dashboard' },
  { icon: '📋', label: 'Medical History', path: '/patient/history' },
  { icon: '💊', label: 'Prescriptions',   path: '/patient/prescriptions' },
  { icon: '🔍', label: 'Find Doctor',     path: '/patient/find-doctor' },
  { icon: '📅', label: 'My Bookings',     path: '/patient/bookings' },
  { icon: '🔔', label: 'Notifications',   path: '/patient/notifications' },
];

export const PatientSidebar: React.FC<{ active: string }> = ({ active }) => {
  const { patient, logout } = usePatientAuth();
  const navigate = useNavigate();
  const [toastCount, setToastCount] = useState(0);

  usePatientWebSocket(patient?.patientId ?? null, () => setToastCount(c => c + 1));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={sidebarStyles.sidebar}>
      <div style={sidebarStyles.brand}>
        <div style={sidebarStyles.brandIcon}>🏥</div>
        <div>
          <div style={sidebarStyles.brandName}>MediFlow<span style={{ color: '#0EA5E9' }}>IQ</span></div>
          <div style={sidebarStyles.brandRole}>Patient Portal</div>
        </div>
      </div>

      <nav style={sidebarStyles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.path;
          const badge = item.label === 'Notifications' && toastCount > 0 ? toastCount : null;
          return (
            <Link key={item.path} to={item.path} style={{
              ...sidebarStyles.navItem,
              ...(isActive ? sidebarStyles.navItemActive : {}),
            }}>
              <span style={sidebarStyles.navIcon}>{item.icon}</span>
              <span style={sidebarStyles.navLabel}>{item.label}</span>
              {badge && <span style={sidebarStyles.badge}>{badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={sidebarStyles.footer}>
        <div style={sidebarStyles.patientInfo}>
          <div style={sidebarStyles.avatar}>{patient?.fullName?.charAt(0) ?? 'P'}</div>
          <div>
            <div style={sidebarStyles.patientName}>{patient?.fullName}</div>
            <div style={sidebarStyles.patientEmail}>{patient?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={sidebarStyles.logoutBtn}>🚪 Sign Out</button>
      </div>
    </aside>
  );
};

const sidebarStyles: Record<string, React.CSSProperties> = {
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
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
  },
  brandName: { fontSize: '1.1rem', fontWeight: 700, color: 'white' },
  brandRole: { fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.7rem 0.75rem', borderRadius: '10px',
    color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem',
    fontWeight: 500, transition: 'all 0.15s', position: 'relative',
  },
  navItemActive: {
    background: 'rgba(14,165,233,0.15)', color: '#0EA5E9',
    borderLeft: '3px solid #0EA5E9',
  },
  navIcon: { fontSize: '1.1rem', width: '20px', textAlign: 'center' },
  navLabel: {},
  badge: {
    marginLeft: 'auto', background: '#EF4444', color: 'white',
    borderRadius: '99px', fontSize: '0.65rem', padding: '0.15rem 0.45rem', fontWeight: 700,
  },
  footer: {
    padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)',
    marginTop: 'auto',
  },
  patientInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 700, fontSize: '0.9rem',
  },
  patientName: { fontSize: '0.8rem', fontWeight: 600, color: 'white' },
  patientEmail: { fontSize: '0.65rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' },
  logoutBtn: {
    width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#F87171', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem',
    cursor: 'pointer', fontFamily: 'inherit',
  },
};

// ── Layout wrapper ─────────────────────────────────────────────────────────

export const PatientLayout: React.FC<{ children: React.ReactNode; active: string; title?: string }> = ({ children, active, title }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FF', fontFamily: "'Inter', sans-serif" }}>
    <PatientSidebar active={active} />
    <main style={{ marginLeft: '240px', flex: 1, padding: '2rem', minHeight: '100vh' }}>
      {title && <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>{title}</h1>}
      {children}
    </main>
  </div>
);

// ── Dashboard ──────────────────────────────────────────────────────────────

export const PatientDashboard: React.FC = () => {
  const { patient } = usePatientAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient) return;
    fetch(`${API_BASE}/patient/${patient.patientId}/dashboard`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [patient]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <PatientLayout active="/patient/dashboard"><LoadingSpinner /></PatientLayout>;

  const conditions: any[] = data?.activeConditions ?? [];
  const history: any[] = data?.recentHistory ?? [];
  const appointments: any[] = data?.upcomingAppointments ?? [];

  return (
    <PatientLayout active="/patient/dashboard">
      {/* Greeting */}
      <div style={dash.greeting}>
        <div>
          <h1 style={dash.greetTitle}>{greeting}, {patient?.fullName?.split(' ')[0]} 👋</h1>
          <p style={dash.greetSub}>Here's your health summary for today</p>
        </div>
        <Link to="/patient/find-doctor" style={dash.bookBtn}>+ Book Appointment</Link>
      </div>

      {/* Stats */}
      <div style={dash.statsGrid}>
        {[
          { icon: '🩺', label: 'Active Conditions', value: conditions.length, color: '#0EA5E9' },
          { icon: '💊', label: 'Current Medications', value: data?.activeMedications ?? 0, color: '#10B981' },
          { icon: '📅', label: 'Upcoming Appts.', value: appointments.length, color: '#F59E0B' },
          { icon: '🏥', label: 'Medical Records', value: history.length, color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={dash.statCard}>
            <div style={{ ...dash.statIcon, background: s.color + '15', fontSize: '1.4rem' }}>{s.icon}</div>
            <div style={{ ...dash.statValue, color: s.color }}>{s.value}</div>
            <div style={dash.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={dash.twoCol}>
        {/* Current Conditions */}
        <div style={dash.section}>
          <h2 style={dash.sectionTitle}>🩺 Current Conditions</h2>
          {conditions.length === 0
            ? <EmptyState msg="No active conditions on record" />
            : conditions.map((c: any) => (
                <div key={c.id} style={dash.condCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={dash.condName}>{c.conditionName}</div>
                      {c.icdCode && <div style={dash.condIcd}>ICD: {c.icdCode}</div>}
                    </div>
                    <SeverityBadge severity={c.severity} />
                  </div>
                  {c.treatingDoctor && (
                    <div style={dash.condDoctor}>
                      👨‍⚕️ Dr. {c.treatingDoctor.name} · {c.treatingDoctor.specialty}
                    </div>
                  )}
                  {c.notes && <div style={dash.condNotes}>{c.notes}</div>}
                </div>
              ))
          }
        </div>

        {/* Recent History */}
        <div style={dash.section}>
          <h2 style={dash.sectionTitle}>📋 Recent Medical History</h2>
          {history.length === 0
            ? <EmptyState msg="No medical records found" />
            : history.map((r: any) => (
                <div key={r.id} style={dash.timelineItem}>
                  <div style={{ ...dash.timelineDot, background: visitTypeColor(r.visitType) }} />
                  <div style={dash.timelineContent}>
                    <div style={dash.timelineDate}>{new Date(r.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={dash.timelineTitle}>{r.diagnosis || r.visitType}</div>
                    <div style={dash.timelineDoc}>
                      {r.doctor && `Dr. ${r.doctor.name}`}
                      {r.hospital && ` · ${r.hospital.name}`}
                    </div>
                    <span style={{ ...dash.visitTypeBadge, background: visitTypeColor(r.visitType) + '20', color: visitTypeColor(r.visitType) }}>
                      {r.visitType?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
          }
          <Link to="/patient/history" style={dash.viewAll}>View full history →</Link>
        </div>
      </div>
    </PatientLayout>
  );
};

const visitTypeColor = (type: string) => {
  const map: Record<string, string> = {
    CONSULTATION: '#0EA5E9', SURGERY: '#EF4444',
    LAB_RESULT: '#10B981', FOLLOW_UP: '#F59E0B', EMERGENCY: '#DC2626',
  };
  return map[type] ?? '#64748B';
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, [string, string]> = {
    STABLE:     ['#D1FAE5', '#059669'],
    MONITORING: ['#FEF3C7', '#D97706'],
    CRITICAL:   ['#FEE2E2', '#DC2626'],
  };
  const [bg, text] = colors[severity] ?? ['#F1F5F9', '#64748B'];
  return <span style={{ background: bg, color: text, borderRadius: '99px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{severity}</span>;
};

const dash: Record<string, React.CSSProperties> = {
  greeting: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.75rem',
  },
  greetTitle: { fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', margin: 0 },
  greetSub: { color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' },
  bookBtn: {
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: 'white',
    textDecoration: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem',
    fontWeight: 600, fontSize: '0.9rem',
    boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: {
    background: 'white', borderRadius: '14px', padding: '1.25rem',
    border: '1px solid #E2E8F0', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' },
  statValue: { fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' },
  statLabel: { fontSize: '0.8rem', color: '#64748B', fontWeight: 500 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  section: { background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' },
  condCard: {
    border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem',
    marginBottom: '0.75rem', borderLeft: '4px solid #0EA5E9',
  },
  condName: { fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' },
  condIcd: { fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.15rem' },
  condDoctor: { fontSize: '0.8rem', color: '#64748B', marginTop: '0.5rem' },
  condNotes: { fontSize: '0.8rem', color: '#64748B', marginTop: '0.5rem', fontStyle: 'italic' },
  timelineItem: { display: 'flex', gap: '1rem', marginBottom: '1rem', position: 'relative' },
  timelineDot: { width: '12px', height: '12px', borderRadius: '50%', marginTop: '0.35rem', flexShrink: 0 },
  timelineContent: { flex: 1 },
  timelineDate: { fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500, marginBottom: '0.15rem' },
  timelineTitle: { fontWeight: 600, color: '#0F172A', fontSize: '0.875rem', marginBottom: '0.15rem' },
  timelineDoc: { fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' },
  visitTypeBadge: { fontSize: '0.68rem', borderRadius: '99px', padding: '0.15rem 0.5rem', fontWeight: 600 },
  viewAll: { display: 'block', textAlign: 'center', marginTop: '0.75rem', color: '#0EA5E9', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' },
};

// ── Helpers ────────────────────────────────────────────────────────────────

export const LoadingSpinner: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#0EA5E9', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

export const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
    📭 {msg}
  </div>
);
